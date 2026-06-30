import { formatNumberString, parseNumberString } from '../../../utils/format';

interface ParticipationDetailsProps {
  participationFormat: string;
  participationDetails: any;
  setParticipationDetails: (value: any) => void;
  calculatedLtv: string;
  setOwnMoney: (value: string) => void;
}

// Формы деталей по выбранному формату участия (8 веток). Вынесены из CreateDeal
// для уменьшения размера формы; имена пропсов совпадают с локальными переменными,
// поэтому тело JSX перенесено без изменений.
export function ParticipationDetails({
  participationFormat,
  participationDetails,
  setParticipationDetails,
  calculatedLtv,
  setOwnMoney,
}: ParticipationDetailsProps) {
  return (
    <>
              {participationFormat === 'full_ownership' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Форма владения</label>
                    <select 
                      value={participationDetails.ownershipForm || 'физлицо'} 
                      onChange={e => setParticipationDetails({...participationDetails, ownershipForm: e.target.value})}
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
                    >
                      {['физлицо', 'ИП', 'ООО', 'другое'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доля владения</label>
                    <input 
                      type="text" readOnly value="100%"
                      className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none font-mono"
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
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Количество участников</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.participantCount)}
                      onChange={e => setParticipationDetails({...participationDetails, participantCount: parseNumberString(e.target.value)})}
                      placeholder="5"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setParticipationDetails({...participationDetails, hasAgreement: !participationDetails.hasAgreement})}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${participationDetails.hasAgreement ? 'bg-emerald-500' : 'bg-track-off'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-surface shadow-sm transform transition-transform duration-200 ${participationDetails.hasAgreement ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-300">Есть соглашение</span>
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
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доля в компании (%)</label>
                    <input 
                      type="number" value={participationDetails.companySharePercent}
                      onChange={e => setParticipationDetails({...participationDetails, companySharePercent: e.target.value})}
                      placeholder="25"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Тип участия</label>
                    <select 
                      value={participationDetails.participationType || 'доля в ООО'}
                      onChange={e => setParticipationDetails({...participationDetails, participationType: e.target.value})}
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
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
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${participationDetails.companyOwnsObject ? 'bg-emerald-500' : 'bg-track-off'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-surface shadow-sm transform transition-transform duration-200 ${participationDetails.companyOwnsObject ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-300">Компания владеет объектом</span>
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
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Управляющая компания</label>
                    <input 
                      type="text" value={participationDetails.managementCompany}
                      onChange={e => setParticipationDetails({...participationDetails, managementCompany: e.target.value})}
                      placeholder="УК «Арт Финанс»"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Количество паёв</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.unitCount)}
                      onChange={e => setParticipationDetails({...participationDetails, unitCount: parseNumberString(e.target.value)})}
                      placeholder="150"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Стоимость одного пая</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.unitPrice)}
                      onChange={e => setParticipationDetails({...participationDetails, unitPrice: parseNumberString(e.target.value)})}
                      placeholder="10 000"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доля в фонде (%)</label>
                    <input 
                      type="number" value={participationDetails.fundSharePercent}
                      onChange={e => setParticipationDetails({...participationDetails, fundSharePercent: e.target.value})}
                      placeholder="5"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
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
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ставка годовых (%)</label>
                    <input 
                      type="number" value={participationDetails.annualRate}
                      onChange={e => setParticipationDetails({...participationDetails, annualRate: e.target.value})}
                      placeholder="18"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Срок займа (мес)</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.loanTermMonths)}
                      onChange={e => setParticipationDetails({...participationDetails, loanTermMonths: parseNumberString(e.target.value)})}
                      placeholder="12"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Оценочная стоимость залога</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.collateralAppraisedValue)}
                      onChange={e => setParticipationDetails({...participationDetails, collateralAppraisedValue: parseNumberString(e.target.value)})}
                      placeholder="10 000 000"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">LTV (%)</label>
                    <input 
                      type="text" readOnly value={calculatedLtv ? `${calculatedLtv}%` : '—'}
                      className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Периодичность выплат</label>
                    <select 
                      value={participationDetails.payoutFrequency || 'ежемесячно'}
                      onChange={e => setParticipationDetails({...participationDetails, payoutFrequency: e.target.value})}
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
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
                        className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
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
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ожидаемая доходность (%)</label>
                    <input 
                      type="number" value={participationDetails.expectedYield}
                      onChange={e => setParticipationDetails({...participationDetails, expectedYield: e.target.value})}
                      placeholder="22"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Срок проекта (мес)</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.loanTermMonths)}
                      onChange={e => setParticipationDetails({...participationDetails, loanTermMonths: parseNumberString(e.target.value)})}
                      placeholder="24"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Механика выплат</label>
                    <select 
                      value={participationDetails.payoutMechanic || 'фикс'}
                      onChange={e => setParticipationDetails({...participationDetails, payoutMechanic: e.target.value})}
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
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
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${participationDetails.hasAgreement ? 'bg-emerald-500' : 'bg-track-off'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-surface shadow-sm transform transition-transform duration-200 ${participationDetails.hasAgreement ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-300">Есть обеспечение</span>
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
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доля участия (%)</label>
                    <input 
                      type="number" value={participationDetails.sharePercent}
                      onChange={e => setParticipationDetails({...participationDetails, sharePercent: e.target.value})}
                      placeholder="10"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Оператор проекта</label>
                    <input 
                      type="text" value={participationDetails.projectOperator}
                      onChange={e => setParticipationDetails({...participationDetails, projectOperator: e.target.value})}
                      placeholder="X7 Syndicate"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Количество участников</label>
                    <input 
                      type="text" value={formatNumberString(participationDetails.participantCount)}
                      onChange={e => setParticipationDetails({...participationDetails, participantCount: parseNumberString(e.target.value)})}
                      placeholder="8"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Модель распределения прибыли</label>
                    <input 
                      type="text" value={participationDetails.profitDistributionModel}
                      onChange={e => setParticipationDetails({...participationDetails, profitDistributionModel: e.target.value})}
                      placeholder="70% инвесторам / 30% GP"
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setParticipationDetails({...participationDetails, hasContract: !participationDetails.hasContract})}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${participationDetails.hasContract ? 'bg-emerald-500' : 'bg-track-off'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-surface shadow-sm transform transition-transform duration-200 ${participationDetails.hasContract ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-xs font-bold text-slate-300">Есть договор</span>
                  </div>
                </div>
              )}
    </>
  );
}
