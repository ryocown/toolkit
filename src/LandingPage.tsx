import { Link } from 'react-router-dom';
import { Map, Calculator, ArrowRight, Github, TrendingUp, Users, Activity } from 'lucide-react';

const LandingPage = () => {
  const tools = [
    {
      title: "Tax Roadmap",
      description: "Strategic compliance and asset defense dashboard for Japan residents. Track your immigration and tax status over time.",
      path: "/tax-roadmap",
      icon: <Map className="w-8 h-8 text-indigo-500" />,
      color: "from-indigo-500/10 to-blue-500/10",
      borderColor: "border-indigo-100",
      hoverBorder: "hover:border-indigo-300"
    },
    {
      title: "Japan Income Tax Calculator",
      description: "Estimate your take-home pay including RSU and stock options. Comprehensive calculator for Japan's tax system.",
      path: "/japan-tax-calculator",
      icon: <Calculator className="w-8 h-8 text-emerald-500" />,
      color: "from-emerald-500/10 to-teal-500/10",
      borderColor: "border-emerald-100",
      hoverBorder: "hover:border-emerald-300"
    },
    {
      title: "FIRE Sandbox",
      description: "Visualize the impact of life events and market conditions on your path to financial independence. Runs entirely in browser.",
      path: "/fire-calculator",
      icon: <TrendingUp className="w-8 h-8 text-orange-500" />,
      color: "from-orange-500/10 to-amber-500/10",
      borderColor: "border-orange-100",
      hoverBorder: "hover:border-orange-300"
    },
    {
      title: "Synod AI",
      description: "Virtual policy panel where multiple AI models debate complex topics and deliver consensus verdicts. Powered by Gemini.",
      path: "/synod-ai",
      icon: <Users className="w-8 h-8 text-purple-500" />,
      color: "from-purple-500/10 to-indigo-500/10",
      borderColor: "border-purple-100",
      hoverBorder: "hover:border-purple-300"
    },
    {
      title: "Macro Dashboard",
      description: "Real-time economic monitor tracking treasury yields, inflation, and market trends to identify current regime shifts.",
      path: "/macro-dashboard",
      icon: <Activity className="w-8 h-8 text-blue-500" />,
      color: "from-blue-500/10 to-cyan-500/10",
      borderColor: "border-blue-100",
      hoverBorder: "hover:border-blue-300"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Personal Toolkit v1.0
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          Strategic Finance & <br />
          <span className="text-indigo-600">Compliance Tools</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          A collection of specialized tools designed to navigate the complexities of Japanese taxation,
          immigration, and financial planning.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tools.map((tool, index) => (
            <Link
              key={index}
              to={tool.path}
              className={`group relative p-8 rounded-3xl bg-white border-2 ${tool.borderColor} ${tool.hoverBorder} shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10">
                <div className="mb-6 inline-block p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                  {tool.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  {tool.description}
                </p>
                <div className="flex items-center text-sm font-bold text-indigo-600 uppercase tracking-wider">
                  Launch Tool
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Github className="w-5 h-5" />
            <span>Open Source Toolkit</span>
          </div>
          <div className="text-slate-400 text-sm font-mono">
            Built with React & Vite • Hosted on GitHub Pages
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
