export const PAGES = ["Home", "Explorer", "Comparison", "Methodology"];
export default function Nav({ page, go }) {
  return (
    <nav className="flex flex-wrap justify-between items-center gap-4 pt-9 pb-5">
      <button onClick={() => go("Home")} aria-label="RoTerra home">
        <img src={`${import.meta.env.BASE_URL}R.svg`} alt="RoTerra" className="h-40 w-auto" />
      </button>
      <ul className="flex gap-4 sm:gap-8 text-lg sm:text-xl">
        {PAGES.map((p) => (
          <li key={p}><button onClick={() => go(p)} className={p === page ? "font-semibold underline" : "hover:underline"}>{p}</button></li>
        ))}
      </ul>
    </nav>
  );
}