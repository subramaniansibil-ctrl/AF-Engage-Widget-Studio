import { apiSlice } from '../api/apiSlice';

export interface TwoPotSimulationInput {
  savingsPotBalance: number;
  retirementPotBalance: number;
  withdrawalAmount: number;
  taxRate: number;
  yearsToRetirement: number;
  expectedGrowthRate: number;
}

export interface TwoPotSimulationOutput {
  estimatedTax: number;
  netWithdrawal: number;
  projectedRetirementLoss: number;
  projectedRetirementValue: number;
  baselineRetirementValue: number;
  illustrationDisclaimer: string;
}

export interface OnefeeSimulationInput {
  portfolioValue: number;
  currentFeePercentage: number;
  onefeePercentage: number;
  investmentTerm: number;
  expectedGrowthRate: number;
}

export interface OnefeeSimulationOutput {
  currentFeeCost: number;
  onefeeCost: number;
  estimatedSavings: number;
  projectedWealthDifference: number;
  currentFeeEndingValue: number;
  onefeeEndingValue: number;
  illustrationDisclaimer: string;
}

export interface IncomeSustainabilityInput {
  retirementPortfolioValue: number;
  monthlyIncome: number;
  annualGrowthRate: number;
  inflationRate: number;
  retirementYears: number;
}

export interface IncomeSustainabilityOutput {
  annualDrawdownRate: number;
  estimatedLongevity: number;
  sustainabilityScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | string;
  projectedEndingBalance: number;
  illustrationDisclaimer: string;
}

export const simulationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    calculateTwoPot: builder.mutation<TwoPotSimulationOutput, TwoPotSimulationInput>({
      query: (body) => ({
        url: '/simulations/two-pot',
        method: 'POST',
        body,
      }),
    }),
    calculateOnefee: builder.mutation<OnefeeSimulationOutput, OnefeeSimulationInput>({
      query: (body) => ({
        url: '/simulations/onefee',
        method: 'POST',
        body,
      }),
    }),
    calculateIncomeSustainability: builder.mutation<IncomeSustainabilityOutput, IncomeSustainabilityInput>({
      query: (body) => ({
        url: '/simulations/income-sustainability',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useCalculateIncomeSustainabilityMutation,
  useCalculateOnefeeMutation,
  useCalculateTwoPotMutation,
} = simulationsApi;
