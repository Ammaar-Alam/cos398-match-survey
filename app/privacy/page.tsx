
export default function Privacy() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy & Data Use</h1>
        <div className="prose prose-slate max-w-none">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Data Collection</h2>
            <p className="text-slate-700 leading-relaxed">
              Data are collected for academic research purposes. Identifiers (Couple Code, NetID, and name) are stored only to link partners and manage participation. No matching or scoring is performed in this application.
            </p>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Data Use</h2>
            <p className="text-slate-700 leading-relaxed">
              De-identified data will be used to evaluate matching algorithms offline. All data are stored securely and will only be accessed by / for research purposes.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Your Rights</h2>
            <p className="text-slate-700 leading-relaxed">
              Participation is voluntary. You may withdraw at any time by contacting the researcher (Ammaar Alam). Your data will be handled in accordance with IRB guidelines and applicable privacy regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
