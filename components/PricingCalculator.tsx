import React, { useState, useEffect } from "react";
import { formatCurrency } from "../utils";

interface PricingCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  isOpen,
  onClose,
}) => {
  // User inputs
  const [desiredPayout, setDesiredPayout] = useState<string>("5000");
  const [affiliate, setAffiliate] = useState<string>("5");
  const [admin, setAdmin] = useState<string>("9");
  const [ongkir, setOngkir] = useState<string>("4");
  const [flashSale, setFlashSale] = useState<string>("0");
  const [promotion, setPromotion] = useState<string>("0");
  const [fixedFee, setFixedFee] = useState<string>("1250");

  // Calculated results
  const [hargaJual, setHargaJual] = useState<number>(0);
  const [totalFees, setTotalFees] = useState<number>(0);
  const [percentageFees, setPercentageFees] = useState<number>(0);

  useEffect(() => {
    calculateSellingPrice();
  }, [desiredPayout, affiliate, admin, ongkir, flashSale, promotion, fixedFee]);

  const calculateSellingPrice = () => {
    const desired = parseFloat(desiredPayout) || 0;
    const fixed = parseFloat(fixedFee) || 0;
    const totalPercentage =
      (parseFloat(affiliate) || 0) +
      (parseFloat(admin) || 0) +
      (parseFloat(ongkir) || 0) +
      (parseFloat(flashSale) || 0) +
      (parseFloat(promotion) || 0);

    // Formula: HargaJual = (DesiredPayout + FixedFee) / (1 - totalPercentage/100)
    // This is derived from: DesiredPayout = HargaJual - (HargaJual * totalPercentage/100) - FixedFee
    if (totalPercentage >= 100) {
      setHargaJual(0);
      setTotalFees(0);
      setPercentageFees(0);
      return;
    }

    const calculatedHargaJual = (desired + fixed) / (1 - totalPercentage / 100);
    const calculatedPercentageFees =
      (calculatedHargaJual * totalPercentage) / 100;
    const calculatedTotalFees = calculatedPercentageFees + fixed;

    setHargaJual(calculatedHargaJual);
    setPercentageFees(calculatedPercentageFees);
    setTotalFees(calculatedTotalFees);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-shopee-orange to-red-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">💰 Pricing Calculator</h2>
              <p className="text-sm opacity-90 mt-1">
                Calculate selling price from desired payout
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Result Card - Prominent Display */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="text-center">
              <div className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">
                Required Selling Price (Harga Jual)
              </div>
              <div className="text-5xl font-bold text-green-700 dark:text-green-300 mb-4">
                {formatCurrency(hargaJual)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Total Fees
                  </div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    -{formatCurrency(totalFees)}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Your Payout
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(hargaJual - totalFees)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-shopee-orange text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                1
              </span>
              Desired Payout
            </h3>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                How much do you want to receive?
              </label>
              <input
                type="number"
                value={desiredPayout}
                onChange={(e) => setDesiredPayout(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-shopee-orange focus:border-shopee-orange"
                placeholder="5000"
              />
            </div>
          </div>

          {/* Fee Percentages */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-shopee-orange text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                2
              </span>
              Fee Percentages
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Affiliate %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={affiliate}
                  onChange={(e) => setAffiliate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-shopee-orange focus:border-shopee-orange"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Admin %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={admin}
                  onChange={(e) => setAdmin(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-shopee-orange focus:border-shopee-orange"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ongkir %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ongkir}
                  onChange={(e) => setOngkir(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-shopee-orange focus:border-shopee-orange"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Flash Sale %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={flashSale}
                  onChange={(e) => setFlashSale(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-shopee-orange focus:border-shopee-orange"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Promotion %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={promotion}
                  onChange={(e) => setPromotion(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-shopee-orange focus:border-shopee-orange"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Fixed Fee (Rp)
                </label>
                <input
                  type="number"
                  value={fixedFee}
                  onChange={(e) => setFixedFee(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-shopee-orange focus:border-shopee-orange"
                />
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              Fee Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Percentage Fees (
                  {(parseFloat(affiliate) || 0) +
                    (parseFloat(admin) || 0) +
                    (parseFloat(ongkir) || 0) +
                    (parseFloat(flashSale) || 0) +
                    (parseFloat(promotion) || 0)}
                  %)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(percentageFees)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Fixed Fee
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(parseFloat(fixedFee) || 0)}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-600 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Total Fees
                </span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalFees)}
                </span>
              </div>
            </div>
          </div>

          {/* Formula Explanation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">How it works:</p>
                <p className="text-xs leading-relaxed">
                  The calculator uses the formula:{" "}
                  <code className="bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded">
                    Harga Jual = (Desired Payout + Fixed Fee) / (1 - Total%/100)
                  </code>
                  <br />
                  This ensures you receive exactly your desired amount after all
                  fees are deducted.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 p-4 rounded-b-2xl border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-shopee-orange hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
