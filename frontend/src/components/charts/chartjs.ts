import { Chart as ChartJS } from 'chart.js';
import 'chart.js/auto';

export const afChartColors = {
  ink: '#17212f',
  sage: '#00a878',
  ocean: '#006a8e',
  gold: '#c7933d',
  coral: '#dc6b57',
  slate: '#5a7f71',
  mist: '#d8e1e8',
};

export const afChartBarPalette = [
  afChartColors.ink,
  afChartColors.sage,
  afChartColors.ocean,
  afChartColors.gold,
  afChartColors.coral,
  afChartColors.slate,
] as const;

export function afChartBarColor(index: number, offset = 0) {
  return afChartBarPalette[(index + offset) % afChartBarPalette.length];
}

ChartJS.defaults.color = '#17212f';
ChartJS.defaults.font.family = 'Outfit, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
ChartJS.defaults.borderColor = 'rgba(23, 33, 47, 0.12)';
ChartJS.defaults.plugins.legend.labels.boxWidth = 12;
ChartJS.defaults.plugins.legend.labels.boxHeight = 12;
ChartJS.defaults.plugins.tooltip.backgroundColor = '#17212f';
ChartJS.defaults.plugins.tooltip.titleColor = '#ffffff';
ChartJS.defaults.plugins.tooltip.bodyColor = '#ffffff';
