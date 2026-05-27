import logo from '../assets/myLogo.png'

function ConsultationReceiptPrint({
  activities = [],
  groupedByPet = [],
  buildRows,
  formatDate,
  receiptNo = 'N/A',
  receiptDateLabel = 'N/A',
  clinicName = '',
  clinicAddress = '',
  clinicPhone = '',
  clientName = 'Unknown',
  contactNumber = 'N/A',
  uniquePetCount = 0,
  consultationFee = 0,
  medicinesTotal = 0,
  totalAmount = 0,
  hasFollowUp = false,
  attendingVeterinarian = '',
  editableBilling = false,
  editingFee = false,
  feeInput = 0,
  onFeeInputChange,
  onToggleFeeEdit,
  onSaveFee,
  editingTotal = false,
  totalInput = 0,
  onTotalInputChange,
  onToggleTotalEdit,
  onSaveTotal,
  customTotal = null,
  footerText = 'Thank you for trusting HappiDogs Veterinary Clinic.',
  headerTitle = 'Clinical Record',
}) {
  return (
    <div className="summary-print-wrap flex-1 overflow-auto py-8 px-4 print:p-0 print:overflow-visible print:h-auto print:block">
      <div className="summary-print-page bg-white mx-auto print:shadow-none print:mx-auto flex flex-col w-full max-w-[210mm] print:h-auto"
        style={{ minHeight: '297mm', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>

        <div className="flex flex-col flex-1 px-4 sm:px-10 py-6 sm:py-7 print:px-3 print:py-1 space-y-3 print:space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3 print:gap-0.5 print:mb-0.5">
            <div className="flex items-center gap-3 print:gap-1.5">
              <img src={logo} alt="HappiDogs" className="w-12 h-12 print:w-10 print:h-10 object-contain"
                onError={(e) => { e.target.style.display = 'none' }} />
              <div>
                <h1 className="text-base print:text-xs font-black uppercase tracking-wide text-gray-900 leading-none print:leading-tight">{clinicName}</h1>
                <h2 className="text-xs print:text-[9px] font-bold uppercase tracking-widest text-gray-500 leading-none print:leading-tight">Veterinary Clinic</h2>
                <p className="text-s font-bold print:text-[9px] text-black mt-0.5 print:mt-0">{clinicAddress}</p>
                <p className="text-s font-bold print:text-[9px] text-black">Tel: {clinicPhone}</p>
              </div>
            </div>
            <div className="text-right print:text-right">
              <div className="inline-block border-2 border-gray-900 px-4 py-2 print:px-1.5 print:py-0.5 mb-2 print:mb-0.5">
                <p className="text-xs print:text-[9px] font-black uppercase tracking-widest text-gray-900 leading-none">{headerTitle}</p>
              </div>
              <div className="text-xs print:text-[9px] text-gray-500 space-y-0 print:space-y-0">
                <p>
                  <span className="font-semibold text-gray-700">Facebook page:</span>
                  <span className="font-bold text-gray-900 ml-1">{receiptNo}</span>
                </p>
                <p><span className="font-semibold text-gray-700">Date:</span> {receiptDateLabel}</p>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-900 border-b border-gray-300 mb-1 print:mb-0.5" />

          <div className="summary-print-client-box grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 print:gap-1 print:mb-1 px-4 py-3 print:px-1.5 print:py-1">
            <div className="space-y-1.5 text-xs print:text-[9px]">
              <div className="flex gap-2 items-baseline">
                <span className="text-gray-500 font-medium w-24 flex-shrink-0">Owner's Name:</span>
                <span className="font-bold text-gray-900 border-b border-gray-400 flex-1 pb-0.5">{clientName}</span>
              </div>
              <div className="flex gap-2 items-baseline">
                <span className="text-gray-500 font-medium w-24 flex-shrink-0">Contact No.:</span>
                <span className="font-semibold text-gray-900 border-b border-gray-400 flex-1 pb-0.5">{contactNumber}</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex gap-2 items-baseline">
                <span className="text-gray-500 font-medium w-20 flex-shrink-0">No. of Pets:</span>
                <span className="font-bold text-gray-900 border-b border-gray-400 flex-1 pb-0.5">{uniquePetCount}</span>
              </div>
              <div className="flex gap-2 items-baseline">
                <span className="text-gray-500 font-medium w-20 flex-shrink-0">Pet Name(s):</span>
                <span className="font-semibold text-gray-900 border-b border-gray-400 flex-1 pb-0.5">
                  {groupedByPet.map(g => g.petName).join(', ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1 print:mb-0.5">
            <div className="h-3.5 w-1 rounded-full bg-gray-900" />
            <p className="text-xs print:text-[9px] font-black uppercase tracking-widest text-gray-900">Clinical Summary</p>
          </div>

          <div className="w-full print:mb-1">
            <table className="w-full text-xs border-collapse mb-3 print:mb-1 print:text-[9px]" style={{ borderTop: '2px solid #111827' }}>
              <thead>
                <tr style={{ background: '#111827' }} className="text-white">
                  <th className="px-2.5 py-2 print:px-1 print:py-0.5 text-left font-bold border-r border-gray-600 w-[12%]">Pet</th>
                  <th className="px-2.5 py-2 print:px-1 print:py-0.5 text-left font-bold border-r border-gray-600 w-[13%]">Activity</th>
                  <th className="px-2.5 py-2 print:px-1 print:py-0.5 text-left font-bold border-r border-gray-600 w-[23%]">Clinical Notes</th>
                  <th className="px-2.5 py-2 print:px-1 print:py-0.5 text-left font-bold border-r border-gray-600 w-[22%]">Medicine / Item</th>
                  <th className="px-2.5 py-2 print:px-1 print:py-0.5 text-center font-bold border-r border-gray-600 w-[10%]">Qty</th>
                  <th className="px-2.5 py-2 print:px-1 print:py-0.5 text-right font-bold border-r border-gray-600 w-[10%]">Unit Price</th>
                  <th className="px-2.5 py-2 print:px-1 print:py-0.5 text-right font-bold w-[10%]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {groupedByPet.map((group, groupIndex) => {
                  const rows = buildRows ? buildRows(group) : []
                  return rows.map((row) => (
                    <tr key={row.key}
                      style={{ background: groupIndex % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                      className="border-b border-gray-200">
                      {row.isFirstInGroup && (
                        <td rowSpan={rows.length}
                          className="px-2.5 py-2 print:px-1 print:py-0.5 border-r border-gray-200 font-black text-gray-900 align-top"
                          style={{ borderLeft: '3px solid #111827' }}>
                          {row.petName}
                        </td>
                      )}
                      {row.isFirstInActivity && (
                        <td rowSpan={row.activityMedCount || 1}
                          className="px-2.5 py-2 print:px-1 print:py-0.5 border-r border-gray-200 font-semibold text-gray-700 align-top whitespace-nowrap">
                          {row.activityType}
                        </td>
                      )}
                      {row.isFirstInActivity && (
                        <td rowSpan={row.activityMedCount || 1}
                          className="px-2.5 py-2 print:px-1 print:py-0.5 border-r border-gray-200 text-gray-700 align-top">
                          {row.detailParts?.length > 0 ? (
                            <div className="space-y-0.5 print:space-y-0 print:text-[8px]">
                              {row.detailParts.map((d, index) => (
                                <div key={index}>
                                  <span className="font-semibold text-gray-500">{d.label}: </span>
                                  <span className="text-gray-800">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      )}
                      <td className="px-2.5 py-2 print:px-1 print:py-0.5 border-r border-gray-200 text-gray-900">
                        {row.med ? row.med.medicineName : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-2.5 py-2 print:px-1 print:py-0.5 border-r border-gray-200 text-center text-gray-700">
                        {row.med ? `${row.med.quantity} ${row.med.unit}` : '—'}
                      </td>
                      <td className="px-2.5 py-2 print:px-1 print:py-0.5 border-r border-gray-200 text-right text-gray-700">
                        {row.med ? `₱${(row.med.pricePerUnit ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-2.5 py-2 print:px-1 print:py-0.5 text-right font-semibold text-gray-900">
                        {row.med
                          ? `₱${((row.med.pricePerUnit ?? 0) * (row.med.quantity || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-2 print:mb-1">
            <div className="w-full sm:w-80">
              <div className="flex items-center gap-2 mb-1 print:mb-0.5">
                <div className="h-3.5 w-1 rounded-full bg-gray-900" />
                <p className="text-xs print:text-[9px] font-black uppercase tracking-widest text-gray-900">Billing Summary</p>
              </div>
              <div className="border border-gray-300 overflow-hidden">
                <div className="flex justify-between items-center px-3 py-1.5 text-xs print:text-[9px] bg-gray-50 border-b border-gray-200">
                  <span className="text-gray-600">Professional Fee</span>
                  {editableBilling && editingFee ? (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-xs">₱</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        min="0"
                        step="50"
                        value={feeInput}
                        onChange={(e) => onFeeInputChange?.(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-20 px-1 py-0.5 text-xs text-right border border-blue-400 rounded focus:outline-none [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                        style={{ appearance: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                        autoFocus
                      />
                      <button onClick={onSaveFee}
                        className="px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition-colors ml-1">
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-900">
                        ₱{consultationFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                      {editableBilling && onToggleFeeEdit && (
                        <button
                          onClick={onToggleFeeEdit}
                          className="ml-2 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 hover:border-blue-400 transition-colors flex items-center gap-1"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center px-3 py-1.5 text-xs print:text-[9px] bg-gray-50 border-b border-gray-200">
                  <span className="text-gray-600">Medications & Items</span>
                  <span className="font-semibold text-gray-900">
                    ₱{medicinesTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center px-3 py-1.5 print:py-1" style={{ background: '#111827' }}>
                  <span className="text-xs print:text-[9px] font-black uppercase tracking-wide text-white">Total Amount Due</span>
                  {editableBilling && editingTotal ? (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">₱</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        min="0"
                        step="50"
                        value={totalInput}
                        onChange={(e) => onTotalInputChange?.(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-24 px-1 py-0.5 text-xs text-right border border-blue-400 rounded bg-gray-800 text-white focus:outline-none [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                        style={{ appearance: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                        autoFocus
                      />
                      <button onClick={onSaveTotal}
                        className="px-2 py-0.5 text-xs font-semibold bg-green-400 text-gray-900 rounded hover:bg-green-300 transition-colors ml-1">
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black text-white">
                        ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                      {customTotal !== null && (
                        <span className="text-xs text-blue-400 ml-1">(edited)</span>
                      )}
                      {editableBilling && onToggleTotalEdit && (
                        <button
                          onClick={onToggleTotalEdit}
                          className="ml-2 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 hover:border-blue-400 transition-colors flex items-center gap-1"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {hasFollowUp && (
            <div className="summary-print-followup-box mb-2 print:mb-0.5 px-4 py-2.5 print:px-1.5 print:py-0.5">
              <p className="text-xs print:text-[9px] font-bold text-gray-700 uppercase tracking-wide mb-0.5">Follow-up Schedule</p>
              {activities.filter(a => a.followUpDate).map((activity, index) => (
                <p key={index} className="text-xs print:text-[9px] text-gray-600">
                  <span className="font-semibold">{activity.petName}</span> — {formatDate ? formatDate(activity.followUpDate) : activity.followUpDate}
                  {activity.followUpNote && <span className="text-gray-500 ml-1 italic">({activity.followUpNote})</span>}
                </p>
              ))}
            </div>
          )}

          <div className="flex-1 print:hidden" />

          <div className="flex justify-end mt-2 print:mt-0.5 mb-2 print:mb-0.5">
            <div className="text-center w-60 print:w-32">
              <p className="text-xs print:text-[8px] font-semibold text-gray-700 leading-none mb-0.5 print:mb-0">{attendingVeterinarian || ' '}</p>
              <div className="border-b-2 border-gray-400 mb-1 print:mb-0.5 h-2 print:h-1" />
              <p className="text-xs print:text-[8px] font-bold text-gray-700 uppercase tracking-wide leading-none">Attending Veterinarian</p>
            </div>
          </div>

          <div className="summary-print-footer mt-2 print:mt-1">
            <div className="border-t border-gray-400 w-full" />
            <p className="mt-1 text-[8px] text-center text-gray-500 italic print:mt-0.5">{footerText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultationReceiptPrint