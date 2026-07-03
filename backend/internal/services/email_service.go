package services

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"html/template"
	"io"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/config"
)

var ErrEmailNotConfigured = errors.New("email provider is not configured")

type DashboardPublishedEmail struct {
	ClientName   string
	ClientEmail  string
	AdvisorName  string
	DashboardURL string
}

// EmailService keeps notification delivery independent from the selected provider.
// A future SES, SendGrid, or Resend implementation only needs to satisfy this interface.
type EmailService interface {
	SendDashboardPublished(ctx context.Context, message DashboardPublishedEmail) error
}

func NewEmailService(cfg config.Config) EmailService {
	if !strings.EqualFold(strings.TrimSpace(cfg.EmailProvider), "smtp") {
		return disabledEmailService{}
	}
	return &smtpEmailService{
		host: cfg.SMTPHost, port: cfg.SMTPPort, username: cfg.SMTPUsername,
		password: cfg.SMTPPassword, fromEmail: cfg.SMTPFromEmail,
		fromName: cfg.SMTPFromName, tlsMode: strings.ToLower(strings.TrimSpace(cfg.SMTPTLSMode)),
	}
}

type disabledEmailService struct{}

func (disabledEmailService) SendDashboardPublished(context.Context, DashboardPublishedEmail) error {
	return ErrEmailNotConfigured
}

type smtpEmailService struct {
	host      string
	port      string
	username  string
	password  string
	fromEmail string
	fromName  string
	tlsMode   string
}

func (s *smtpEmailService) SendDashboardPublished(ctx context.Context, message DashboardPublishedEmail) error {
	if err := s.validate(message); err != nil {
		return err
	}
	body, err := renderDashboardPublishedEmail(message)
	if err != nil {
		return fmt.Errorf("render dashboard email: %w", err)
	}
	return s.send(ctx, message.ClientEmail, "Your Alexforbes dashboard is ready", body)
}

func (s *smtpEmailService) validate(message DashboardPublishedEmail) error {
	if s.host == "" || s.port == "" || s.fromEmail == "" {
		return ErrEmailNotConfigured
	}
	if _, err := mail.ParseAddress(s.fromEmail); err != nil {
		return fmt.Errorf("invalid SMTP sender address: %w", err)
	}
	if _, err := mail.ParseAddress(message.ClientEmail); err != nil {
		return fmt.Errorf("invalid client email address: %w", err)
	}
	if message.DashboardURL == "" {
		return errors.New("dashboard URL is required")
	}
	return nil
}

func (s *smtpEmailService) send(ctx context.Context, recipient string, subject string, htmlBody string) error {
	address := net.JoinHostPort(s.host, s.port)
	tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12, ServerName: s.host}
	dialer := &net.Dialer{Timeout: 10 * time.Second}
	var connection net.Conn
	var err error
	if s.tlsMode == "implicit" {
		connection, err = tls.DialWithDialer(dialer, "tcp", address, tlsConfig)
	} else {
		connection, err = dialer.DialContext(ctx, "tcp", address)
	}
	if err != nil {
		return fmt.Errorf("connect SMTP server: %w", err)
	}
	defer connection.Close()
	deadline := time.Now().Add(15 * time.Second)
	if contextDeadline, ok := ctx.Deadline(); ok && contextDeadline.Before(deadline) {
		deadline = contextDeadline
	}
	if err := connection.SetDeadline(deadline); err != nil {
		return fmt.Errorf("set SMTP deadline: %w", err)
	}

	client, err := smtp.NewClient(connection, s.host)
	if err != nil {
		return fmt.Errorf("initialize SMTP client: %w", err)
	}
	defer client.Close()
	if s.tlsMode == "starttls" {
		if ok, _ := client.Extension("STARTTLS"); !ok {
			return errors.New("SMTP server does not support STARTTLS")
		}
		if err := client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("start SMTP TLS: %w", err)
		}
	}
	if s.username != "" {
		if err := client.Auth(smtp.PlainAuth("", s.username, s.password, s.host)); err != nil {
			return fmt.Errorf("authenticate SMTP client: %w", err)
		}
	}
	if err := client.Mail(s.fromEmail); err != nil {
		return fmt.Errorf("set SMTP sender: %w", err)
	}
	if err := client.Rcpt(recipient); err != nil {
		return fmt.Errorf("set SMTP recipient: %w", err)
	}
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("open SMTP message: %w", err)
	}
	from := (&mail.Address{Name: s.fromName, Address: s.fromEmail}).String()
	message := buildMIMEMessage(from, recipient, subject, htmlBody)
	if _, err := io.WriteString(writer, message); err != nil {
		writer.Close()
		return fmt.Errorf("write SMTP message: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("close SMTP message: %w", err)
	}
	if err := client.Quit(); err != nil {
		return fmt.Errorf("complete SMTP delivery: %w", err)
	}
	return nil
}

func buildMIMEMessage(from string, to string, subject string, htmlBody string) string {
	return "From: " + from + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" + htmlBody
}

func renderDashboardPublishedEmail(message DashboardPublishedEmail) (string, error) {
	var output bytes.Buffer
	if err := dashboardPublishedTemplate.Execute(&output, message); err != nil {
		return "", err
	}
	return output.String(), nil
}

var dashboardPublishedTemplate = template.Must(template.New("dashboard-published").Parse(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f8f8;font-family:Arial,sans-serif;color:#06263d">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f8f8;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dce7e7;border-radius:16px;overflow:hidden">
        <tr><td style="background:#06263d;padding:24px 32px;color:#ffffff"><strong style="font-size:20px">Alexforbes Widget Studio</strong></td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 12px;font-size:16px">Hello {{.ClientName}},</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25">Your dashboard is ready</h1>
          <p style="margin:0 0 24px;color:#496273;line-height:1.6">{{.AdvisorName}} has published your updated financial dashboard. Sign in securely to review your widgets and latest information.</p>
          <p style="margin:0 0 28px"><a href="{{.DashboardURL}}" style="display:inline-block;background:#00a76f;color:#06263d;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:10px">View your dashboard</a></p>
          <p style="margin:0;color:#6c7f8c;font-size:13px;line-height:1.5">If the button does not work, open this link:<br><a href="{{.DashboardURL}}" style="color:#006f84">{{.DashboardURL}}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`))
