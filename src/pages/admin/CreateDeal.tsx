import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Save, 
  Briefcase, 
  Key, 
  Users, 
  Building2, 
  Landmark, 
  Coins, 
  Percent, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Info,
  ChevronDown
} from 'lucide-react';
import { useDeals, Deal } from '../../context/DealContext';
import { calculateDealMetrics } from '../../utils/mathCore';

const FORMATS = [
  { id: 'full_ownership', label: 'Полная собственность', icon: Key, desc: '100% владение коммерческим объектом инвестором' },
  { id: 'fractional_ownership', label: 'Долевая собственность в объекте', icon: Users, desc: 'Прямое долевое владение недвижимостью в Росреестре' },
  { id: 'legal_entity_share', label: 'Доля в юридическом лице', icon: Building2, desc: 'Владение долей в ООО/АО, которое владеет объектом' },
  { id: 'zpif_units', label: 'Паи ЗПИФ', icon: Landmark, desc: 'Приобретение инвестиционных паев фонда недвижимости' },
  { id: 'collateral_loan', label: 'Займ под залог недвижимости', icon: Coins, desc: 'Предоставление займа под обременение объекта в пользу инвестора' },
  { id: 'non_collateral_loan', label: 'Займ без залога', icon: AlertTriangle, desc: 'Займ под поручительство или вексельное обеспечение' },
  { id: 'investment_participation', label: 'Инвестиционное участие в проекте', icon: Briefcase, desc: 'Вход в девелоперский проект или синдикат с фикс. доходностью' },
  { id: 'partner_syndicate', label: 'Партнёрская сделка / синдикат', icon: Users, desc: 'Совместное участие под управлением профессионального оператора' }
];

const formatNumberString = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/\s/g, '');
  if (isNaN(Number(numStr))) return String(val);
  const parts = numStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

const parseNumberString = (val: string) => {
  return val.replace(/\s/g, '');
};

export default function CreateDeal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deals, saveDeal } = useDeals();

  const isEdit = Boolean(id);
  const existingDeal = useMemo(() => deals.find(d => d.id === id), [deals, id]);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('ГАБ');
  const [status, setStatus] = useState('Куплен');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [description, setDescription] = useState('');
  
  // Collapsible Block 1 Additional
  const [showAdditional, setShowAdditional] = useState(false);
  const [additional, setAdditional] = useState({
    floor: '1',
    separateEntrance: false,
    showcases: false,
    wetPoints: '',
    electricalPower: '',
    parking: false
  });

  // Block 2: Format
  const [participationFormat, setParticipationFormat] = useState('full_ownership');
  const [participationDetails, setParticipationDetails] = useState<any>({
    ownershipForm: 'физлицо',
    sharePercent: '',
    participantCount: '',
    hasAgreement: false,
    companyName: '',
    companySharePercent: '',
    participationType: 'доля в ООО',
    companyOwnsObject: false,
    fundName: '',
    managementCompany: '',
    unitCount: '',
    unitPrice: '',
    fundSharePercent: '',
    loanAmount: '',
    annualRate: '',
    loanTermMonths: '',
    collateralAppraisedValue: '',
    ltvPercent: '',
    payoutFrequency: 'ежемесячно',
    extraCollateral: '',
    expectedYield: '',
    payoutMechanic: 'фикс',
    projectOperator: '',
    profitDistributionModel: '',
    hasContract: false
  });

  // Block 3: Financials
  const [currency, setCurrency] = useState('RUB');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [ownMoney, setOwnMoney] = useState('');
  const [creditMoney, setCreditMoney] = useState('');
  const [propertyPrice, setPropertyPrice] = useState('');
  const [extraExpenses, setExtraExpenses] = useState<Array<{ id: string; category: string; amount: number }>>([
    { id: '1', category: 'Комиссия брокера', amount: 0 },
    { id: '2', category: 'Юридическая проверка', amount: 0 }
  ]);

  // Loan Details
  const [loan, setLoan] = useState({
    downPayment: '',
    annualRate: '',
    termMonths: '',
    monthlyPayment: '',
    paymentType: 'Аннуитетный',
    currentDebtBalance: '',
    startDate: ''
  });

  // Rental Income (Tenants)
  const [tenants, setTenants] = useState<Array<any>>([]);

  // Monthly Expenses (OPEX)
  const [expenses, setExpenses] = useState({
    utilities: '',
    operating: '',
    propertyTax: '',
    insurance: '',
    maintenance: '',
    managementCompany: '',
    accounting: '',
    vacancyReserve: '',
    repairReserve: '',
    taxModel: 'usn_income',
    taxRate: 6
  });

  // Performance
  const [performance, setPerformance] = useState({
    plannedTermMonths: '',
    expectedYield: '',
    plannedProfit: '',
    currentMarketValue: ''
  });

  // Scroll target refs
  const block1Ref = useRef<HTMLDivElement>(null);
  const block2Ref = useRef<HTMLDivElement>(null);
  const block3Ref = useRef<HTMLDivElement>(null);

  // Validation States
  const [showValidation, setShowValidation] = useState(false);

  // Pre-fill form if editing
  useEffect(() => {
    if (isEdit && existingDeal) {
      setName(existingDeal.name || '');
      setType(existingDeal.type || 'ГАБ');
      setStatus(existingDeal.status || 'Куплен');
      setCity(existingDeal.city || '');
      setAddress(existingDeal.address || '');
      setAreaSqm(String(existingDeal.areaSqm || ''));
      setDescription(existingDeal.description || '');
      
      if (existingDeal.additional) {
        setAdditional({
          floor: existingDeal.additional.floor || '1',
          separateEntrance: Boolean(existingDeal.additional.separateEntrance),
          showcases: Boolean(existingDeal.additional.showcases),
          wetPoints: String(existingDeal.additional.wetPoints || ''),
          electricalPower: String(existingDeal.additional.electricalPower || ''),
          parking: Boolean(existingDeal.additional.parking)
        });
      }

      if (existingDeal.participationFormat) {
        setParticipationFormat(existingDeal.participationFormat);
      }
      if (existingDeal.participationDetails) {
        setParticipationDetails({
          ...participationDetails,
          ...existingDeal.participationDetails
        });
      }

      if (existingDeal.financials) {
        setCurrency(existingDeal.financials.currency || 'RUB');
        setPurchaseDate(existingDeal.financials.purchaseDate || '');
        setOwnMoney(String(existingDeal.financials.ownMoney || ''));
        setCreditMoney(String(existingDeal.financials.creditMoney || ''));
        setPropertyPrice(existingDeal.financials.propertyPrice ? String(existingDeal.financials.propertyPrice) : '');
        setExtraExpenses(existingDeal.financials.extraExpenses || []);
      }

      if (existingDeal.loan) {
        setLoan({
          downPayment: String(existingDeal.loan.downPayment || ''),
          annualRate: String(existingDeal.loan.annualRate || ''),
          termMonths: String(existingDeal.loan.termMonths || ''),
          monthlyPayment: String(existingDeal.loan.monthlyPayment || ''),
          paymentType: existingDeal.loan.paymentType || 'Аннуитетный',
          currentDebtBalance: String(existingDeal.loan.currentDebtBalance || ''),
          startDate: existingDeal.loan.startDate || ''
        });
      }

      if (existingDeal.rent?.tenants) {
        setTenants(existingDeal.rent.tenants);
      }

      if (existingDeal.expenses) {
        setExpenses({
          utilities: String(existingDeal.expenses.utilities || ''),
          operating: String(existingDeal.expenses.operating || ''),
          propertyTax: String(existingDeal.expenses.propertyTax || ''),
          insurance: String(existingDeal.expenses.insurance || ''),
          maintenance: String(existingDeal.expenses.maintenance || ''),
          managementCompany: String(existingDeal.expenses.managementCompany || ''),
          accounting: String(existingDeal.expenses.accounting || ''),
          vacancyReserve: String(existingDeal.expenses.vacancyReserve || ''),
          repairReserve: String(existingDeal.expenses.repairReserve || ''),
          taxModel: existingDeal.expenses.taxModel || 'usn_income',
          taxRate: Number(existingDeal.expenses.taxRate) || 6
        });
      }

      if (existingDeal.performance) {
        setPerformance({
          plannedTermMonths: String(existingDeal.performance.plannedTermMonths || ''),
          expectedYield: String(existingDeal.performance.expectedYield || ''),
          plannedProfit: String(existingDeal.performance.plannedProfit || ''),
          currentMarketValue: String(existingDeal.performance.currentMarketValue || '')
        });
      }
    }
  }, [isEdit, existingDeal]);

  // Update tax rate automatically on model change, while keeping it editable
  const handleTaxModelChange = (model: string) => {
    let rate = 6;
    if (model === 'usn_income') rate = 6;
    else if (model === 'usn_income_expenses') rate = 15;
    else if (model === 'ndfl') rate = 13;
    setExpenses(prev => ({ ...prev, taxModel: model, taxRate: rate }));
  };

  // Extra expenses helper
  const addExtraExpense = () => {
    setExtraExpenses(prev => [
      ...prev,
      { id: Date.now().toString(), category: 'Комиссия брокера', amount: 0 }
    ]);
  };

  const removeExtraExpense = (expId: string) => {
    setExtraExpenses(prev => prev.filter(e => e.id !== expId));
  };

  const updateExtraExpense = (expId: string, field: 'category' | 'amount', value: any) => {
    setExtraExpenses(prev => prev.map(e => {
      if (e.id !== expId) return e;
      return { ...e, [field]: field === 'amount' ? Number(value) || 0 : value };
    }));
  };

  // Tenants helper
  const addTenant = () => {
    setTenants(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        areaSqm: '',
        monthlyRent: '',
        ratePerSqm: '',
        startDate: '',
        endDate: '',
        indexationPercent: '',
        securityDeposit: '',
        paysUtilities: 'Арендатор',
        rentHolidays: false,
        vacateRisk: 'низкий'
      }
    ]);
  };

  const removeTenant = (tenantId: string) => {
    setTenants(prev => prev.filter(t => t.id !== tenantId));
  };

  const updateTenant = (tenantId: string, field: string, value: any) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      return { ...t, [field]: value };
    }));
  };

  // ZPIF unit price & count auto-calculates ownMoney
  useEffect(() => {
    if (participationFormat === 'zpif_units') {
      const count = Number(participationDetails.unitCount) || 0;
      const price = Number(participationDetails.unitPrice) || 0;
      if (count && price) {
        setOwnMoney(String(count * price));
      }
    }
  }, [participationFormat, participationDetails.unitCount, participationDetails.unitPrice]);

  // Synchronize loan downpayment with ownMoney by default
  useEffect(() => {
    if (Number(creditMoney) > 0 && !loan.downPayment && ownMoney) {
      setLoan(prev => ({ ...prev, downPayment: ownMoney }));
    }
  }, [creditMoney, ownMoney]);

  // Collateral loan LTV auto-calculation
  const calculatedLtv = useMemo(() => {
    const amt = Number(participationDetails.loanAmount) || Number(ownMoney) || 0;
    const val = Number(participationDetails.collateralAppraisedValue) || 0;
    if (amt && val) {
      return ((amt / val) * 100).toFixed(1);
    }
    return '';
  }, [participationDetails.loanAmount, ownMoney, participationDetails.collateralAppraisedValue]);

  // Auto-calculated price per sqm
  const pricePerSqm = useMemo(() => {
    const total = (participationFormat === 'fractional_ownership' && Number(propertyPrice) > 0)
      ? Number(propertyPrice)
      : ((Number(ownMoney) || 0) + (Number(creditMoney) || 0));
    const area = Number(areaSqm) || 0;
    return area > 0 ? Math.round(total / area) : 0;
  }, [ownMoney, creditMoney, areaSqm, propertyPrice, participationFormat]);

  // Aggregate deal object for metrics calculation
  const aggregatedDeal = useMemo(() => {
    return {
      participationFormat,
      participationDetails: {
        ...participationDetails,
        ltvPercent: calculatedLtv || participationDetails.ltvPercent
      },
      financials: {
        currency,
        purchaseDate,
        ownMoney: Number(ownMoney) || 0,
        creditMoney: Number(creditMoney) || 0,
        propertyPrice: Number(propertyPrice) || 0,
        extraExpenses
      },
      loan: {
        ...loan,
        downPayment: Number(loan.downPayment) || 0,
        annualRate: Number(loan.annualRate) || 0,
        termMonths: Number(loan.termMonths) || 0,
        monthlyPayment: Number(loan.monthlyPayment) || 0,
        currentDebtBalance: Number(loan.currentDebtBalance) || 0
      },
      rent: {
        tenants: tenants.map(t => ({
          ...t,
          areaSqm: Number(t.areaSqm) || 0,
          monthlyRent: Number(t.monthlyRent) || 0
        }))
      },
      expenses: {
        utilities: Number(expenses.utilities) || 0,
        operating: Number(expenses.operating) || 0,
        propertyTax: Number(expenses.propertyTax) || 0,
        insurance: Number(expenses.insurance) || 0,
        maintenance: Number(expenses.maintenance) || 0,
        managementCompany: Number(expenses.managementCompany) || 0,
        accounting: Number(expenses.accounting) || 0,
        vacancyReserve: Number(expenses.vacancyReserve) || 0,
        repairReserve: Number(expenses.repairReserve) || 0,
        taxModel: expenses.taxModel,
        taxRate: Number(expenses.taxRate) || 0
      },
      performance: {
        ...performance,
        expectedYield: Number(performance.expectedYield) || 0,
        currentMarketValue: Number(performance.currentMarketValue) || 0
      }
    };
  }, [participationFormat, participationDetails, calculatedLtv, currency, purchaseDate, ownMoney, creditMoney, propertyPrice, extraExpenses, loan, tenants, expenses, performance]);

  // Calculate metrics reactively
  const metrics = useMemo(() => calculateDealMetrics(aggregatedDeal), [aggregatedDeal]);

  // Validation: monthly payment covers bank interest
  const isCreditInterestValid = useMemo(() => {
    if (Number(creditMoney) <= 0) return true;
    const debt = Number(loan.currentDebtBalance) || 0;
    const rate = Number(loan.annualRate) || 0;
    const payment = Number(loan.monthlyPayment) || 0;
    if (debt && rate && payment) {
      const minInterest = (debt * rate / 100) / 12;
      return payment >= minInterest;
    }
    return true;
  }, [creditMoney, loan.currentDebtBalance, loan.annualRate, loan.monthlyPayment]);

  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Название сделки обязательно';
    if (!areaSqm.trim() || Number(areaSqm) <= 0) errs.areaSqm = 'Укажите площадь объекта';
    if (!ownMoney.trim() || Number(ownMoney) <= 0) errs.ownMoney = 'Укажите собственные деньги инвестора';

    if (participationFormat === 'fractional_ownership') {
      if (!propertyPrice.trim() || Number(propertyPrice) <= 0) {
        errs.propertyPrice = 'Укажите стоимость объекта';
      }
    }

    if (Number(creditMoney) > 0) {
      if (!loan.annualRate || Number(loan.annualRate) <= 0) {
        errs.loanAnnualRate = 'Укажите ставку годовых по кредиту';
      }
      if (!loan.monthlyPayment || Number(loan.monthlyPayment) <= 0) {
        errs.loanMonthlyPayment = 'Укажите ежемесячный платеж по кредиту';
      } else if (!isCreditInterestValid) {
        errs.loanInterest = 'Платеж не покрывает проценты банка';
      }
    }
    return errs;
  }, [name, areaSqm, ownMoney, creditMoney, loan.annualRate, loan.monthlyPayment, isCreditInterestValid, participationFormat, propertyPrice]);

  const canSave = useMemo(() => {
    return Object.keys(validationErrors).length === 0;
  }, [validationErrors]);

  // Submit deal saving
  const handleSubmit = (isDraft = false) => {
    if (!isDraft && !canSave) {
      setShowValidation(true);
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.border-rose-500, .text-rose-500');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    const dealPayload: Deal = {
      id: isEdit && existingDeal ? existingDeal.id : Date.now().toString(),
      name,
      type,
      city: city || 'Не указан',
      address,
      areaSqm: Number(areaSqm) || 0,
      description,
      status: isDraft ? 'Рассматривается' : (status === 'Куплен' ? 'Аренда' : status),
      targetIrr: String(performance.expectedYield || '0'),
      termDate: performance.plannedTermMonths 
        ? new Date(Date.now() + Number(performance.plannedTermMonths) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10) 
        : (isEdit && existingDeal?.termDate ? existingDeal.termDate : ''),
      gracePeriod: isEdit && existingDeal?.gracePeriod ? existingDeal.gracePeriod : '',
      utilities: expenses.utilities || 0,
      
      additional,
      participationFormat,
      participationDetails: {
        ...participationDetails,
        ltvPercent: calculatedLtv || participationDetails.ltvPercent
      },
      financials: {
        currency,
        purchaseDate,
        ownMoney: Number(ownMoney) || 0,
        creditMoney: Number(creditMoney) || 0,
        propertyPrice: Number(propertyPrice) || 0,
        extraExpenses
      },
      loan: {
        downPayment: Number(loan.downPayment) || 0,
        annualRate: Number(loan.annualRate) || 0,
        termMonths: Number(loan.termMonths) || 0,
        monthlyPayment: Number(loan.monthlyPayment) || 0,
        currentDebtBalance: Number(loan.currentDebtBalance) || 0,
        paymentType: loan.paymentType,
        startDate: loan.startDate
      },
      rent: {
        tenants
      },
      expenses: {
        utilities: Number(expenses.utilities) || 0,
        operating: Number(expenses.operating) || 0,
        propertyTax: Number(expenses.propertyTax) || 0,
        insurance: Number(expenses.insurance) || 0,
        maintenance: Number(expenses.maintenance) || 0,
        managementCompany: Number(expenses.managementCompany) || 0,
        accounting: Number(expenses.accounting) || 0,
        vacancyReserve: Number(expenses.vacancyReserve) || 0,
        repairReserve: Number(expenses.repairReserve) || 0,
        taxModel: expenses.taxModel,
        taxRate: Number(expenses.taxRate) || 0
      },
      performance: {
        plannedTermMonths: Number(performance.plannedTermMonths) || 0,
        expectedYield: Number(performance.expectedYield) || 0,
        plannedProfit: Number(performance.plannedProfit) || 0,
        currentMarketValue: Number(performance.currentMarketValue) || 0
      },
      comments: {
        documents: [],
        investorComment: '',
        internalNote: ''
      }
    };

    saveDeal(dealPayload);
    navigate('/deals');
  };

  const scrollToBlock = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatCurrency = (val: number) => {
    return `${formatNumberString(Math.round(val))} ${currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'AED'}`;
  };

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            {isEdit ? 'Редактировать сделку' : 'Добавить сделку'}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Заполните параметры актива, чтобы сделка появилась в вашем инвестиционном портфеле
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => navigate('/deals')}
            className="px-5 py-2.5 bg-white text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            Отмена
          </button>
          <button 
            onClick={() => handleSubmit(true)}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all shadow-sm"
          >
            Сохранить черновик
          </button>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => scrollToBlock(block1Ref)} className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-600">
          1. Информация
        </button>
        <button onClick={() => scrollToBlock(block2Ref)} className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-600">
          2. Формат участия
        </button>
        <button onClick={() => scrollToBlock(block3Ref)} className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-600">
          3. Финансы
        </button>
      </div>

      {/* Main Grid: Form Left, Sidebar Right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        
        {/* Left Column: Form Blocks */}
        <div className="space-y-8">
          
          {/* Block 1. Basic Info */}
          <div ref={block1Ref} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xs font-mono">1</span>
              Основная информация об активе
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Название сделки *</label>
                <input 
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Например: Покупка Street-retail на Октябрьском пр."
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-300 ${showValidation && validationErrors.name ? 'border-rose-500' : 'border-slate-200 focus:border-emerald-500'}`}
                />
                {showValidation && validationErrors.name && (
                  <span className="text-[10px] text-rose-500 font-bold">{validationErrors.name}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Тип объекта *</label>
                <select 
                  value={type} onChange={e => setType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {['ГАБ', 'Street-retail', 'Офисное помещение', 'Склад', 'Производственное помещение', 'Земельный участок', 'Апартаменты', 'Self-storage / кладовки', 'Редевелопмент', 'Другое'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Статус *</label>
                <select 
                  value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="Куплен">Куплен</option>
                  <option value="В управлении">В управлении</option>
                  <option value="Рассматривается">Черновик / Рассматривается</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Город</label>
                <input 
                  type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Москва"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Адрес объекта</label>
                <input 
                  type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="ул. Ленина, д. 10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Площадь, м² *</label>
                <input 
                  type="text" value={formatNumberString(areaSqm)} onChange={e => setAreaSqm(parseNumberString(e.target.value))}
                  placeholder="120"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono ${showValidation && validationErrors.areaSqm ? 'border-rose-500' : 'border-slate-200'}`}
                />
                {showValidation && validationErrors.areaSqm && (
                  <span className="text-[10px] text-rose-500 font-bold">{validationErrors.areaSqm}</span>
                )}
              </div>

              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Краткое описание сделки</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Описание преимуществ объекта, арендатора или стратегии..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Spoiler / Disclosure */}
            <div className="border-t border-slate-100 pt-4">
              <button 
                type="button" 
                onClick={() => setShowAdditional(!showAdditional)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                <ChevronDown className={`transform transition-transform ${showAdditional ? 'rotate-180' : ''}`} size={16} />
                Дополнительные характеристики объекта
              </button>
              
              {showAdditional && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Этаж</label>
                    <input 
                      type="text" 
                      list="floors-list"
                      value={additional.floor} 
                      onChange={e => setAdditional({...additional, floor: e.target.value})}
                      placeholder="1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    />
                    <datalist id="floors-list">
                      {Array.from({ length: 10 }, (_, i) => String(i + 1)).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </datalist>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Мокрые точки (кол-во)</label>
                    <input 
                      type="text" value={formatNumberString(additional.wetPoints)} onChange={e => setAdditional({...additional, wetPoints: parseNumberString(e.target.value)})}
                      placeholder="2"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Электромощность, кВт</label>
                    <input 
                      type="text" value={formatNumberString(additional.electricalPower)} onChange={e => setAdditional({...additional, electricalPower: parseNumberString(e.target.value)})}
                      placeholder="15"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setAdditional({...additional, separateEntrance: !additional.separateEntrance})}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${additional.separateEntrance ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${additional.separateEntrance ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-700">Отдельный вход</span>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setAdditional({...additional, showcases: !additional.showcases})}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${additional.showcases ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${additional.showcases ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-700">Витрины</span>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setAdditional({...additional, parking: !additional.parking})}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${additional.parking ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${additional.parking ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-700">Имеется парковка</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Block 2. Format of Participation */}
          <div ref={block2Ref} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xs font-mono">2</span>
              Формат участия
            </h2>

            {/* Radio Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FORMATS.map(item => {
                const IconComponent = item.icon;
                const isSelected = participationFormat === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setParticipationFormat(item.id)}
                    className={`text-left p-5 rounded-2xl border transition-all flex gap-4 ${isSelected ? 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/5' : 'border-slate-200 hover:border-slate-400 bg-white'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-tight text-slate-900">{item.label}</h3>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Details form nested in Block 2 */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mt-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Детали выбранного формата</h4>
              
              {participationFormat === 'full_ownership' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Форма владения</label>
                    <select 
                      value={participationDetails.ownershipForm || 'физлицо'} 
                      onChange={e => setParticipationDetails({...participationDetails, ownershipForm: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    >
                      {['физлицо', 'ИП', 'ООО', 'другое'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доля владения</label>
                    <input 
                      type="text" readOnly value="100%"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {participationFormat === 'fractional_ownership' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Процент доли (%)</label>
                    <input 
                      type="number" value={participationDetails.sharePercent} 
                      onChange={e => setParticipationDetails({...participationDetails, sharePercent: e.target.value})}
                      placeholder="15"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Количество участников</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.participantCount)}
                      onChange={e => setParticipationDetails({...participationDetails, participantCount: parseNumberString(e.target.value)})}
                      placeholder="5"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setParticipationDetails({...participationDetails, hasAgreement: !participationDetails.hasAgreement})}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${participationDetails.hasAgreement ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${participationDetails.hasAgreement ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-700">Есть соглашение</span>
                  </div>
                </div>
              )}

              {participationFormat === 'legal_entity_share' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Название юрлица</label>
                    <input 
                      type="text" value={participationDetails.companyName}
                      onChange={e => setParticipationDetails({...participationDetails, companyName: e.target.value})}
                      placeholder="ООО «Х7 Инвест»"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доля в компании (%)</label>
                    <input 
                      type="number" value={participationDetails.companySharePercent}
                      onChange={e => setParticipationDetails({...participationDetails, companySharePercent: e.target.value})}
                      placeholder="25"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Тип участия</label>
                    <select 
                      value={participationDetails.participationType || 'доля в ООО'}
                      onChange={e => setParticipationDetails({...participationDetails, participationType: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="доля в ООО">Доля в ООО</option>
                      <option value="акции АО">Акции АО</option>
                      <option value="другое">Другое</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setParticipationDetails({...participationDetails, companyOwnsObject: !participationDetails.companyOwnsObject})}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${participationDetails.companyOwnsObject ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${participationDetails.companyOwnsObject ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-700">Компания владеет объектом</span>
                  </div>
                </div>
              )}

              {participationFormat === 'zpif_units' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Название фонда</label>
                    <input 
                      type="text" value={participationDetails.fundName}
                      onChange={e => setParticipationDetails({...participationDetails, fundName: e.target.value})}
                      placeholder="ЗПИФ «Коммерческая аренда»"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Управляющая компания</label>
                    <input 
                      type="text" value={participationDetails.managementCompany}
                      onChange={e => setParticipationDetails({...participationDetails, managementCompany: e.target.value})}
                      placeholder="УК «Арт Финанс»"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Количество паёв</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.unitCount)}
                      onChange={e => setParticipationDetails({...participationDetails, unitCount: parseNumberString(e.target.value)})}
                      placeholder="150"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Стоимость одного пая</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.unitPrice)}
                      onChange={e => setParticipationDetails({...participationDetails, unitPrice: parseNumberString(e.target.value)})}
                      placeholder="10 000"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доля в фонде (%)</label>
                    <input 
                      type="number" value={participationDetails.fundSharePercent}
                      onChange={e => setParticipationDetails({...participationDetails, fundSharePercent: e.target.value})}
                      placeholder="5"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {(participationFormat === 'collateral_loan' || participationFormat === 'non_collateral_loan') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Сумма займа</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.loanAmount)}
                      onChange={e => {
                        const val = parseNumberString(e.target.value);
                        setParticipationDetails({...participationDetails, loanAmount: val});
                        setOwnMoney(val); // set own money automatically
                      }}
                      placeholder="5 000 000"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ставка годовых (%)</label>
                    <input 
                      type="number" value={participationDetails.annualRate}
                      onChange={e => setParticipationDetails({...participationDetails, annualRate: e.target.value})}
                      placeholder="18"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Срок займа (мес)</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.loanTermMonths)}
                      onChange={e => setParticipationDetails({...participationDetails, loanTermMonths: parseNumberString(e.target.value)})}
                      placeholder="12"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Оценочная стоимость залога</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.collateralAppraisedValue)}
                      onChange={e => setParticipationDetails({...participationDetails, collateralAppraisedValue: parseNumberString(e.target.value)})}
                      placeholder="10 000 000"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">LTV (%)</label>
                    <input 
                      type="text" readOnly value={calculatedLtv ? `${calculatedLtv}%` : '—'}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Периодичность выплат</label>
                    <select 
                      value={participationDetails.payoutFrequency || 'ежемесячно'}
                      onChange={e => setParticipationDetails({...participationDetails, payoutFrequency: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    >
                      {['ежемесячно', 'ежеквартально', 'в конце срока', 'другое'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  {participationFormat === 'non_collateral_loan' && (
                    <div className="md:col-span-3 flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Дополнительное обеспечение/поручительство</label>
                      <input 
                        type="text" value={participationDetails.extraCollateral}
                        onChange={e => setParticipationDetails({...participationDetails, extraCollateral: e.target.value})}
                        placeholder="Личное поручительство бенефициара, залог оборудования..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {participationFormat === 'investment_participation' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Сумма участия</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.loanAmount)}
                      onChange={e => {
                        const val = parseNumberString(e.target.value);
                        setParticipationDetails({...participationDetails, loanAmount: val});
                        setOwnMoney(val);
                      }}
                      placeholder="3 000 000"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ожидаемая доходность (%)</label>
                    <input 
                      type="number" value={participationDetails.expectedYield}
                      onChange={e => setParticipationDetails({...participationDetails, expectedYield: e.target.value})}
                      placeholder="22"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Срок проекта (мес)</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.loanTermMonths)}
                      onChange={e => setParticipationDetails({...participationDetails, loanTermMonths: parseNumberString(e.target.value)})}
                      placeholder="24"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Механика выплат</label>
                    <select 
                      value={participationDetails.payoutMechanic || 'фикс'}
                      onChange={e => setParticipationDetails({...participationDetails, payoutMechanic: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="фикс">Фикс</option>
                      <option value="% от прибыли">% от прибыли</option>
                      <option value="смешанная">Смешанная</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setParticipationDetails({...participationDetails, hasAgreement: !participationDetails.hasAgreement})}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${participationDetails.hasAgreement ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${participationDetails.hasAgreement ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-700">Есть обеспечение</span>
                  </div>
                </div>
              )}

              {participationFormat === 'partner_syndicate' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Сумма участия</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.loanAmount)}
                      onChange={e => {
                        const val = parseNumberString(e.target.value);
                        setParticipationDetails({...participationDetails, loanAmount: val});
                        setOwnMoney(val);
                      }}
                      placeholder="2 500 000"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доля участия (%)</label>
                    <input 
                      type="number" value={participationDetails.sharePercent}
                      onChange={e => setParticipationDetails({...participationDetails, sharePercent: e.target.value})}
                      placeholder="10"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Оператор проекта</label>
                    <input 
                      type="text" value={participationDetails.projectOperator}
                      onChange={e => setParticipationDetails({...participationDetails, projectOperator: e.target.value})}
                      placeholder="X7 Syndicate"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Количество участников</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.participantCount)}
                      onChange={e => setParticipationDetails({...participationDetails, participantCount: parseNumberString(e.target.value)})}
                      placeholder="8"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Модель распределения прибыли</label>
                    <input 
                      type="text" value={participationDetails.profitDistributionModel}
                      onChange={e => setParticipationDetails({...participationDetails, profitDistributionModel: e.target.value})}
                      placeholder="70% инвесторам / 30% GP"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setParticipationDetails({...participationDetails, hasContract: !participationDetails.hasContract})}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${participationDetails.hasContract ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${participationDetails.hasContract ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-700">Есть договор</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Block 3. Financial Parameters */}
          <div ref={block3Ref} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xs font-mono">3</span>
              Финансовые параметры
            </h2>

            {/* 3.1 CAPEX */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">3.1. Параметры входа и Расходы (CAPEX)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Валюта</label>
                  <select 
                    value={currency} onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="RUB">RUB (₽)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="AED">AED (Dh)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Дата покупки / входа</label>
                  <input 
                    type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Срок владения (мес.)</label>
                  <input 
                    type="text" value={formatNumberString(performance.plannedTermMonths)} 
                    onChange={e => setPerformance({...performance, plannedTermMonths: parseNumberString(e.target.value)})}
                    placeholder="24"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Собственные деньги *</label>
                  <input 
                    type="text" value={formatNumberString(ownMoney)} onChange={e => setOwnMoney(parseNumberString(e.target.value))}
                    placeholder="10 000 000"
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono ${showValidation && validationErrors.ownMoney ? 'border-rose-500' : 'border-slate-200'}`}
                  />
                  {showValidation && validationErrors.ownMoney && (
                    <span className="text-[10px] text-rose-500 font-bold">{validationErrors.ownMoney}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Кредитные деньги банка</label>
                  <input 
                    type="text" value={formatNumberString(creditMoney)} onChange={e => setCreditMoney(parseNumberString(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Сумма инвестиций (Auto)</label>
                  <input 
                    type="text" readOnly value={formatCurrency(metrics.investmentSum)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none font-mono"
                  />
                </div>

                 <div className="flex flex-col gap-2">
                  {participationFormat === 'fractional_ownership' ? (
                    <>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-black">Цена объекта *</label>
                      <input 
                        type="text" value={formatNumberString(propertyPrice)} onChange={e => setPropertyPrice(parseNumberString(e.target.value))}
                        placeholder="10 000 000"
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono ${showValidation && validationErrors.propertyPrice ? 'border-rose-500' : 'border-slate-200'}`}
                      />
                      {showValidation && validationErrors.propertyPrice && (
                        <span className="text-[10px] text-rose-500 font-bold">{validationErrors.propertyPrice}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Цена объекта (Auto)</label>
                      <input 
                        type="text" readOnly value={formatCurrency(metrics.objectPrice)}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none font-mono"
                      />
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Цена объекта за м² (Auto)</label>
                  <input 
                    type="text" readOnly value={pricePerSqm > 0 ? `${formatNumberString(pricePerSqm)} ${currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'AED'}/м²` : '—'}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Extra Expenses */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Дополнительные расходы на сделку</span>
                  <button 
                    type="button" onClick={addExtraExpense}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    <Plus size={14} /> Добавить расход
                  </button>
                </div>

                <div className="space-y-3">
                  {extraExpenses.map(exp => (
                    <div key={exp.id} className="grid grid-cols-[1fr_120px_auto] gap-3 items-center">
                      <select
                        value={exp.category}
                        onChange={e => updateExtraExpense(exp.id, 'category', e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        {['Комиссия брокера', 'Госпошлины', 'Нотариус', 'Оценка', 'Страхование', 'Юридическая проверка', 'Ремонт/подготовка', 'Прочие расходы'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input 
                        type="text" value={exp.amount === 0 ? '' : formatNumberString(exp.amount)}
                        onChange={e => updateExtraExpense(exp.id, 'amount', parseNumberString(e.target.value))}
                        placeholder="Сумма"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none font-mono"
                      />
                      <button 
                        type="button" onClick={() => removeExtraExpense(exp.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3.2 Кредит */}
            {Number(creditMoney) > 0 && (
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">3.2. Данные по кредиту</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Первоначальный взнос</label>
                    <input 
                      type="text" value={formatNumberString(loan.downPayment)} onChange={e => setLoan({...loan, downPayment: parseNumberString(e.target.value)})}
                      placeholder="3 000 000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ставка годовых (%) *</label>
                    <input 
                      type="number" value={loan.annualRate} onChange={e => setLoan({...loan, annualRate: e.target.value})}
                      placeholder="12"
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono ${showValidation && validationErrors.loanAnnualRate ? 'border-rose-500' : 'border-slate-200'}`}
                    />
                    {showValidation && validationErrors.loanAnnualRate && (
                      <span className="text-[10px] text-rose-500 font-bold">{validationErrors.loanAnnualRate}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Срок кредита (мес)</label>
                    <input 
                      type="text" value={formatNumberString(loan.termMonths)} onChange={e => setLoan({...loan, termMonths: parseNumberString(e.target.value)})}
                      placeholder="120"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ежемесячный платёж *</label>
                    <input 
                      type="text" value={formatNumberString(loan.monthlyPayment)} onChange={e => setLoan({...loan, monthlyPayment: parseNumberString(e.target.value)})}
                      placeholder="75 000"
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono ${showValidation && (validationErrors.loanMonthlyPayment || validationErrors.loanInterest) ? 'border-rose-500' : 'border-slate-200'}`}
                    />
                    {showValidation && (validationErrors.loanMonthlyPayment || validationErrors.loanInterest) && (
                      <span className="text-[10px] text-rose-500 font-bold">{validationErrors.loanMonthlyPayment || validationErrors.loanInterest}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Тип платежа</label>
                    <select 
                      value={loan.paymentType} onChange={e => setLoan({...loan, paymentType: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="Аннуитетный">Аннуитетный</option>
                      <option value="Дифференцированный">Дифференцированный</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Текущий остаток долга</label>
                    <input 
                      type="text" value={formatNumberString(loan.currentDebtBalance)} onChange={e => setLoan({...loan, currentDebtBalance: parseNumberString(e.target.value)})}
                      placeholder="9 500 000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Дата начала кредита</label>
                    <input 
                      type="date" value={loan.startDate} onChange={e => setLoan({...loan, startDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Validation message */}
                {showValidation && validationErrors.loanInterest && (
                  <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold">
                    <AlertTriangle size={16} />
                    {validationErrors.loanInterest}
                  </div>
                )}
              </div>
            )}

            {/* 3.3 Арендаторы (Income) */}
            {!(participationFormat === 'non_collateral_loan' || participationFormat === 'zpif_units') && (
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">3.3. Данные по аренде (Доходы)</h3>
                </div>

                <div className="space-y-4">
                  {tenants.map((t, idx) => (
                    <div key={t.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 relative bg-slate-50/50">
                      <button 
                        type="button" onClick={() => removeTenant(t.id)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Удалить арендатора"
                      >
                        <Trash2 size={16} />
                      </button>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Арендатор #{idx + 1}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Название *</label>
                          <input 
                            type="text" value={t.name} onChange={e => updateTenant(t.id, 'name', e.target.value)}
                            placeholder="ООО «ВкусВилл»"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Площадь (м²) *</label>
                          <input 
                            type="text" value={formatNumberString(t.areaSqm)} onChange={e => updateTenant(t.id, 'areaSqm', parseNumberString(e.target.value))}
                            placeholder="85"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Месячная аренда *</label>
                          <input 
                            type="text" value={formatNumberString(t.monthlyRent)} onChange={e => updateTenant(t.id, 'monthlyRent', parseNumberString(e.target.value))}
                            placeholder="150 000"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                          />
                        </div>
                        
                        {/* Optional fields inside Tenant block */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ставка за м²</label>
                          <input 
                            type="text" value={formatNumberString(t.ratePerSqm)} onChange={e => updateTenant(t.id, 'ratePerSqm', parseNumberString(e.target.value))}
                            placeholder="1 760"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Дата начала договора</label>
                          <input 
                            type="date" value={t.startDate} onChange={e => updateTenant(t.id, 'startDate', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Дата окончания договора</label>
                          <input 
                            type="date" value={t.endDate} onChange={e => updateTenant(t.id, 'endDate', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Индексация (%)</label>
                          <input 
                            type="number" value={t.indexationPercent} onChange={e => updateTenant(t.id, 'indexationPercent', e.target.value)}
                            placeholder="5"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Обеспечительный платёж</label>
                          <input 
                            type="text" value={formatNumberString(t.securityDeposit)} onChange={e => updateTenant(t.id, 'securityDeposit', parseNumberString(e.target.value))}
                            placeholder="300 000"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Кто платит КУ</label>
                          <select 
                            value={t.paysUtilities || 'Арендатор'} 
                            onChange={e => updateTenant(t.id, 'paysUtilities', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                          >
                            <option value="Арендатор">Арендатор</option>
                            <option value="Собственник">Собственник</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Риск съезда</label>
                          <select 
                            value={t.vacateRisk || 'низкий'} onChange={e => updateTenant(t.id, 'vacateRisk', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                          >
                            <option value="низкий">Низкий</option>
                            <option value="средний">Средний</option>
                            <option value="высокий">Высокий</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <button
                            type="button"
                            onClick={() => updateTenant(t.id, 'rentHolidays', !t.rentHolidays)}
                            className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${t.rentHolidays ? 'bg-emerald-500' : 'bg-slate-200'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${t.rentHolidays ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </button>
                          <span className="text-xs font-bold text-slate-700">Арендные каникулы</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {tenants.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center gap-3">
                      <span className="text-xs text-slate-400 font-bold">Арендаторы отсутствуют</span>
                      <button 
                        type="button" onClick={addTenant}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all rounded-xl text-xs font-bold"
                      >
                        <Plus size={16} /> Добавить арендатора
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center pt-2">
                      <button 
                        type="button" onClick={addTenant}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        <Plus size={16} /> Добавить арендатора
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Общий арендный поток (в мес.):</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(metrics.totalRentalFlow)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3.4 Ежемесячные расходы (OPEX) */}
            {!(participationFormat === 'non_collateral_loan' || participationFormat === 'zpif_units') && (
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">3.4. Ежемесячные расходы (OPEX)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { key: 'utilities', label: 'Коммунальные платежи' },
                    { key: 'operating', label: 'Эксплуатационные расходы' },
                    { key: 'propertyTax', label: 'Налог на имущество (в месяц)' },
                    { key: 'insurance', label: 'Страхование' },
                    { key: 'maintenance', label: 'Ремонт и обслуживание' },
                    { key: 'managementCompany', label: 'УК' },
                    { key: 'accounting', label: 'Бухгалтерия' },
                    { key: 'vacancyReserve', label: 'Резерв на простой' },
                    { key: 'repairReserve', label: 'Резерв на ремонт' }
                  ].map(item => (
                    <div key={item.key} className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</label>
                      <input 
                        type="text" value={formatNumberString((expenses as any)[item.key])} 
                        onChange={e => setExpenses({...expenses, [item.key]: parseNumberString(e.target.value)})}
                        placeholder="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                      />
                    </div>
                  ))}

                  {/* Tax Model Selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Налоговая модель</label>
                    <select 
                      value={expenses.taxModel} onChange={e => handleTaxModelChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="usn_income">УСН «Доходы» (6%)</option>
                      <option value="usn_income_expenses">УСН «Доходы минус расходы» (15%)</option>
                      <option value="ndfl">НДФЛ (Физлицо) (13%)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Налоговая ставка (%)</label>
                    <input 
                      type="number" value={expenses.taxRate} 
                      onChange={e => setExpenses({...expenses, taxRate: Number(e.target.value) || 0})}
                      placeholder="6"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3.5 Текущее состояние актива */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">3.5. Текущее состояние актива</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Текущая рыночная стоимость актива</label>
                  <input 
                    type="text" value={formatNumberString(performance.currentMarketValue)} 
                    onChange={e => setPerformance({...performance, currentMarketValue: parseNumberString(e.target.value)})}
                    placeholder="12 000 000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Sticky Summary Sidebar */}
        <div className="xl:col-start-2">
          <div className="sticky top-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-5 relative overflow-hidden">
              
              <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
                <span className="font-black text-xs uppercase tracking-widest">Предварительный расчет</span>
              </div>

              {/* Circular Gauge / ROE Visualizer */}
              <div className="flex justify-center items-center py-4 relative">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="66"
                    className="stroke-slate-100"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="66"
                    className="stroke-emerald-500 transition-all duration-500"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={415}
                    strokeDashoffset={415 - (415 * Math.min(100, Math.max(0, metrics.roe))) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center text-center justify-center">
                  <span className="text-xl font-black text-slate-900 leading-none tabular-nums">
                    {metrics.roe > 0 ? `${metrics.roe.toFixed(1)}%` : '0.0%'}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black mt-1 leading-none">
                    Доходн. ROE
                  </span>
                </div>
              </div>

              {/* Reactive Metrics list */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Сумма инвестиций</span>
                  <span className="text-xs font-bold text-slate-900 font-mono">{formatCurrency(metrics.investmentSum)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Чистый поток (NOI)</span>
                  <span className="text-xs font-bold text-emerald-600 font-mono">{formatCurrency(metrics.noi)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Денежный поток (CF)</span>
                  <span className="text-xs font-bold text-emerald-600 font-mono">{formatCurrency(metrics.cashFlow)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Срок окупаемости</span>
                  <span className="text-xs font-bold text-slate-950">
                    {typeof metrics.paybackYears === 'number' ? `${metrics.paybackYears.toFixed(1)} лет` : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Формат участия</span>
                  <span className="text-xs font-bold text-slate-900 text-right max-w-[180px] truncate">
                    {FORMATS.find(f => f.id === participationFormat)?.label || participationFormat}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Статус сделки</span>
                  <span className="text-xs font-bold text-slate-900">{status}</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex gap-3 text-[10px] font-semibold text-emerald-800 leading-normal">
                <Info size={16} className="text-emerald-500 shrink-0" />
                <span>Сделка будет добавлена в ваш портфель с авторасчетом доходности на основе указанных вами параметров актива.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4 px-6 md:px-12 flex justify-between items-center shadow-lg z-30">
        <button 
          onClick={() => navigate('/deals')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Назад
        </button>
        <div className="flex gap-3">
          <button 
            onClick={() => handleSubmit(true)}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all shadow-sm"
          >
            Сохранить черновик
          </button>
          <button 
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Save size={16} /> Добавить в портфель
          </button>
        </div>
      </div>
    </div>
  );
}
