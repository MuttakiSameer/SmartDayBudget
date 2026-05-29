const FinanceMath = {
    // A. Daily Tracker (Budget Architect)
    calculateBudget: (totalIncome, totalExpenses, targetSavingsPercent) => {
        const targetAmount = totalIncome * (targetSavingsPercent / 100);
        const maxAllowedExpenses = totalIncome - targetAmount;
        const remainingAllowance = maxAllowedExpenses - totalExpenses;
        
        const net = totalIncome - totalExpenses;
        const saveLosePercentage = totalIncome > 0 ? (net / totalIncome) * 100 : (net === 0 ? 0 : -100);
        
        return {
            totalIncome,
            totalExpenses,
            targetAmount,
            maxAllowedExpenses,
            remainingAllowance,
            net,
            saveLosePercentage
        };
    },
    
    // B. Compound Interest Calculator
    calculateCompoundInterest: (P, PMT, r, t, n) => {
        const ratePerPeriod = r / 100 / n;
        const periods = n * t;
        
        let compoundPrincipal = 0;
        let compoundPMT = 0;
        
        if (ratePerPeriod === 0) {
            compoundPrincipal = P;
            compoundPMT = PMT * periods;
        } else {
            compoundPrincipal = P * Math.pow(1 + ratePerPeriod, periods);
            compoundPMT = PMT * ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod);
        }
        
        const FV = compoundPrincipal + compoundPMT;
        const totalContributions = P + (PMT * periods);
        const interest = FV - totalContributions;
        
        return { FV, interest, totalContributions };
    },
    
    // C. Loan Amortization Calculator
    calculateLoanAmortization: (L, i, n) => {
        const monthlyRate = i / 100 / 12;
        let M = 0;
        
        if (monthlyRate === 0) {
            M = n > 0 ? L / n : 0;
        } else if (n > 0) {
            M = L * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
        }
        
        const totalCost = M * n;
        const totalInterest = totalCost - L;
        
        return { M, totalInterest, totalCost };
    },
    
    // D. Credit Card Debt Calculator
    calculateCreditCardDebt: (B, APR, p) => {
        const monthlyRate = APR / 100 / 12;
        const monthlyInterest = B * monthlyRate;
        
        if (B <= 0) return { months: 0, totalInterest: 0, finalMonthPayment: 0 };
        if (p <= monthlyInterest) {
            return { error: true, message: "Warning: Your payment is too low to cover monthly interest. Your debt will grow." };
        }
        
        // Calculate exact interest using iterative approach with final month capping
        let remaining = B;
        let totalInterestPaid = 0;
        let count = 0;
        let finalMonthPayment = p;
        
        while (remaining > 0 && count < 1000) {
            let interest = remaining * monthlyRate;
            let requiredForThisMonth = remaining + interest;
            
            if (p >= requiredForThisMonth) {
                finalMonthPayment = requiredForThisMonth;
                totalInterestPaid += interest;
                remaining = 0;
            } else {
                totalInterestPaid += interest;
                remaining = remaining + interest - p;
            }
            count++;
        }
        
        return { months: count, totalInterest: totalInterestPaid, finalMonthPayment: finalMonthPayment };
    },
    
    // E. Savings Goal Calculator
    calculateSavingsGoal: (G, S, T, unit = 'months') => {
        let monthsT = T;
        if (unit === 'days') monthsT = T / 30.4167;
        else if (unit === 'weeks') monthsT = T / 4.34524;
        else if (unit === 'years') monthsT = T * 12;
        
        if (monthsT <= 0) return { monthlyDeposit: 0 };
        const required = (G - S) / monthsT;
        return { monthlyDeposit: Math.max(0, required) };
    },
    
    // F. Smart Financial Statement calculations
    calculateBalanceSheet: (assets, liabilities, equity) => {
        const totalAssets = assets.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalLiabilities = liabilities.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalEquity = equity.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
        return { totalAssets, totalLiabilities, totalEquity, isBalanced };
    },
    calculateIncomeStatement: (revenues, expenses) => {
        const totalRevenue = revenues.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        return { totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
    }
};
