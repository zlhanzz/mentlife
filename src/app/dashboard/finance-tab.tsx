"use client";

import { useState, useTransition, useEffect } from "react";
import { addFinancialTransactionAction } from "@/features/dashboard/actions";
import { useApp } from "@/context/app-context";
import { AlertTriangle } from "lucide-react";
import { evaluateFinancialLadder, FinancialModeState } from "@/services/financial-ladder";
import { UsersCoreData } from "@/types/profile";
import FinanceDashboard from "./FinanceDashboard";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "ALLOCATION";
  category: string;
  amount: number;
  description: string;
  created_at: string;
  date?: string;
}

interface FinanceTabProps {
  initialTransactions: Transaction[];
  monthlyIncome: number;
  fixedExpenses: number;
  totalDebt: number;
  debtDetails: string;
  emergencyFundCurrent: number;
  emergencyFundTarget: number;
  liquidSavings?: number;
  investmentValue?: number;
  usersCore: UsersCoreData;
  financialMode?: FinancialModeState;
}

export default function FinanceTab({
  initialTransactions,
  monthlyIncome,
  fixedExpenses,
  totalDebt,
  debtDetails,
  emergencyFundCurrent,
  emergencyFundTarget,
  liquidSavings = 0,
  investmentValue = 0,
  usersCore,
  financialMode
}: FinanceTabProps) {
  const { lang } = useApp();
  const [isPending, startTransition] = useTransition();

  // Local state for instant feedback and synchronization
  const [txs, setTxs] = useState<Transaction[]>(initialTransactions);
  const [liquid, setLiquid] = useState(liquidSavings);
  const [efCurrent, setEfCurrent] = useState(emergencyFundCurrent);
  const [debt, setDebt] = useState(totalDebt);
  const [invest, setInvest] = useState(investmentValue);

  // Synchronize state with props when props change
  useEffect(() => {
    setTxs(initialTransactions);
  }, [initialTransactions]);

  useEffect(() => {
    setLiquid(liquidSavings);
  }, [liquidSavings]);

  useEffect(() => {
    setEfCurrent(emergencyFundCurrent);
  }, [emergencyFundCurrent]);

  useEffect(() => {
    setDebt(totalDebt);
  }, [totalDebt]);

  useEffect(() => {
    setInvest(investmentValue);
  }, [investmentValue]);

  const isSurvival = financialMode?.isRedAlert || false;

  const ladderState = evaluateFinancialLadder({
    liquidSavings: liquid,
    emergencyFundCurrent: efCurrent,
    fixedExpenses,
    monthlyIncome,
    totalDebt: debt,
    isSandwichGen: usersCore.is_sandwich_gen || false,
    maritalStatus: usersCore.marital_status || 'single',
    countryCode: usersCore.country_code || 'ID',
    investmentValue: invest,
    majorLifeGoals: usersCore.major_life_goals || [],
    ownedAssets: usersCore.owned_assets || [],
  });

  // Handle transaction addition from FinanceDashboard modal
  const handleAddTransaction = async (
    type: "INCOME" | "EXPENSE" | "ALLOCATION",
    category: "Gaji" | "Bisnis" | "Lainnya" | "Kebutuhan Wajib" | "Keinginan" | "Dana Darurat" | "Bayar Utang" | "Investasi",
    amount: number,
    description: string
  ) => {
    const res = await addFinancialTransactionAction(type, category, amount, description);
    if (res.success) {
      const newTx: Transaction = {
        id: Date.now().toString(),
        type,
        category,
        amount,
        description,
        created_at: new Date().toISOString()
      };
      setTxs(p => [newTx, ...p]);

      // Apply double-entry math updates locally
      if (type === "INCOME") {
        setLiquid(l => l + amount);
      } else if (type === "EXPENSE") {
        setLiquid(l => l - amount);
      } else if (type === "ALLOCATION") {
        setLiquid(l => l - amount);
        if (category === "Dana Darurat") {
          setEfCurrent(e => e + amount);
        } else if (category === "Bayar Utang") {
          setDebt(d => Math.max(0, d - amount));
        } else if (category === "Investasi") {
          setInvest(i => i + amount);
        }
      }
    }
    return res;
  };

  return (
    <div className="overflow-y-auto pb-6 space-y-4">

      {/* SURVIVAL ALERT */}
      {isSurvival && (
        <div className="mx-4 mt-4">
          <div className="bg-rose-500/5 border border-rose-500/30 rounded-2xl p-3.5 flex items-start gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-rose-500">
                {lang === "id" ? "Mode Survival — Hard Data Kritis" : "Survival Mode — Critical Status"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {lang === "id"
                  ? "Fokus: potong pengeluaran variabel dan tambah income power secepatnya. Tidak ada ruang untuk investasi."
                  : "Focus: cut variable expenses and boost income power immediately. No room for investments."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FINANCE DASHBOARD MAIN ENGINE */}
      <FinanceDashboard
        transactions={txs}
        financeData={{
          liquid_savings: liquid,
          emergency_fund_current: efCurrent,
          emergency_fund_target: emergencyFundTarget,
          total_debt: debt,
          investment_value: invest
        }}
        ladderLevel={ladderState.level}
        countryCode={usersCore.country_code}
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
}
