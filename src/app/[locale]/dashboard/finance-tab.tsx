"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  debtPaid?: number;
  totalBorrowed?: number;
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
  debtPaid = 0,
  totalBorrowed = 0,
  debtDetails,
  emergencyFundCurrent,
  emergencyFundTarget,
  liquidSavings = 0,
  investmentValue = 0,
  usersCore,
  financialMode
}: FinanceTabProps) {
  const { lang } = useApp();
  const tDash = useTranslations("dashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for instant feedback and synchronization
  const [txs, setTxs] = useState<Transaction[]>(initialTransactions);
  const [liquid, setLiquid] = useState(liquidSavings);
  const [efCurrent, setEfCurrent] = useState(emergencyFundCurrent);
  const [debt, setDebt] = useState(totalDebt);
  const [debtPaidState, setDebtPaid] = useState(debtPaid);
  const [totalBorrowedState, setTotalBorrowed] = useState(totalBorrowed || totalDebt + debtPaid);
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
    setDebtPaid(debtPaid);
  }, [debtPaid]);

  useEffect(() => {
    setTotalBorrowed(totalBorrowed || totalDebt + debtPaid);
  }, [totalBorrowed, totalDebt, debtPaid]);

  useEffect(() => {
    setInvest(investmentValue);
  }, [investmentValue]);

  const isSurvival = financialMode?.isRedAlert || false;

  const ladderState = useMemo(() => evaluateFinancialLadder({
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
  }), [liquid, efCurrent, fixedExpenses, monthlyIncome, debt, invest, usersCore.is_sandwich_gen, usersCore.marital_status, usersCore.country_code, usersCore.major_life_goals, usersCore.owned_assets]);

  // Handle transaction addition from FinanceDashboard modal
  const handleAddTransaction = async (
    type: "INCOME" | "EXPENSE" | "ALLOCATION",
    category: string,
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

      // Apply double-entry math updates locally for instant feedback
      if (type === "INCOME") {
        setLiquid(l => l + amount);
      } else if (type === "EXPENSE") {
        setLiquid(l => l - amount);
      } else if (type === "ALLOCATION") {
        if (category === "Tambah Utang" || category === "Utang Baru") {
          // New debt: cash IN + debt increases
          setLiquid(l => l + amount);
          setDebt(d => d + amount);
          setTotalBorrowed(tb => tb + amount);
        } else {
          setLiquid(l => l - amount);
          if (category === "Dana Darurat") {
            setEfCurrent(e => e + amount);
          } else if (category === "Pelunasan Utang" || category === "Bayar Utang") {
            setDebt(d => Math.max(0, d - amount));
            setDebtPaid(d => d + amount);
          } else if (category === "Investasi") {
            setInvest(i => i + amount);
          }
        }
      }

      // Refresh server data so parent props stay in sync after DB update
      router.refresh();
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
                {tDash("finance.survivalMode")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {tDash("finance.survivalDesc")}
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
          debt_paid: debtPaidState,
          total_borrowed: totalBorrowedState,
          investment_value: invest
        }}
        ladderLevel={ladderState.level}
        countryCode={usersCore.country_code}
        onAddTransaction={handleAddTransaction}
        usersCore={usersCore}
      />
    </div>
  );
}
