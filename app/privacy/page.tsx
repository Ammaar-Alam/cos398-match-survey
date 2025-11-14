
export default function Privacy() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy & Data Use</h1>
        <div className="prose prose-slate max-w-none">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Data Collection</h2>
            <p className="text-slate-700 leading-relaxed">
              We collect your survey responses (answers, acceptable ranges, and importance ratings) along with basic identifiers such as Couple Code, name, and optional NetID or email. These identifiers are used only to link partners, manage participation, and (if needed) contact you about the study. No automated matching or scoring is performed on this website and your data is collected in accordance with the COS 398 course policies for academic research only.
            </p>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Data Use</h2>
            <p className="text-slate-700 leading-relaxed">
              De-identified data will be used to evaluate matching algorithms offline as part of a COS 398 research project and eventual write-up and published paper. Direct identifiers (such as your name, Couple Code, NetID, or email) are removed or replaced with random IDs before analysis. Only the student researcher (Ammaar Alam) and the supervising instructor, Prof. Marcel Dall’Agnol, may access raw identifiable data (if ever needed), and your name will not appear in any write-up or presentation.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Your Rights</h2>
            <p className="text-slate-700 leading-relaxed">
              Participation is voluntary, and you may withdraw at any time by contacting the researcher (Ammaar Alam) or the supervising instructor (Prof. Marcel Dall’Agnol at <a href="mailto:dallagnol@cs.princeton.edu" className="text-blue-600 hover:underline">dallagnol@cs.princeton.edu</a>). If you withdraw, we will stop using your identifiable data and will remove it from future analysis datasets. Your data are used only for this course-based research study and are handled with a focus on confidentiality and de-identification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
