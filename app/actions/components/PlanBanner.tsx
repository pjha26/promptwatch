export function PlanBanner() {
  return (
    <div className="w-full bg-blue-50/50 border-b border-blue-100 text-sm py-2 px-6 flex justify-between items-center">
      <span className="text-blue-800">
        You're on the Explore plan — tracking 10 prompts with ChatGPT only
      </span>
      <button 
        type="button" 
        onClick={(e) => e.preventDefault()}
        className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
      >
        See plans
      </button>
    </div>
  );
}
