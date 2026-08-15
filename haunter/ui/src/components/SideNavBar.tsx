import { 
  IoAnalyticsOutline, 
  IoStatsChartOutline, 
  IoPulseOutline, 
  IoTrendingUpOutline 
} from 'solid-icons/io';

export function SideNavBar() {
  return (
    <aside class="hidden md:flex bg-surface-container-low dark:bg-primary-container border-r border-primary dark:border-outline w-20 flex-col items-center py-4 z-40 flex-shrink-0">
      <div class="mb-8 text-center px-1">
        <IoStatsChartOutline size={30} class="text-primary dark:text-terminal-green mx-auto" />
        <div class="font-label-sm text-label-sm mt-1 text-primary">DATA</div>
      </div>
      <nav class="flex flex-col gap-4 w-full px-2">
        <a class="flex flex-col items-center justify-center p-2 rounded-sm text-muted-gray dark:text-outline-variant hover:bg-surface-container-highest dark:hover:bg-on-primary-fixed-variant transition-colors group" href="#" title="MARKET TICKER">
          <IoTrendingUpOutline size={20} class="group-hover:text-primary transition-colors" />
        </a>
        <a class="flex flex-col items-center justify-center p-2 rounded-sm bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary scale-90 transition-transform group" href="#" title="TSLA">
          <IoStatsChartOutline size={20} />
        </a>
        <a class="flex flex-col items-center justify-center p-2 rounded-sm text-muted-gray dark:text-outline-variant hover:bg-surface-container-highest dark:hover:bg-on-primary-fixed-variant transition-colors group" href="#" title="NDX">
          <IoAnalyticsOutline size={20} class="group-hover:text-primary transition-colors" />
        </a>
        <a class="flex flex-col items-center justify-center p-2 rounded-sm text-muted-gray dark:text-outline-variant hover:bg-surface-container-highest dark:hover:bg-on-primary-fixed-variant transition-colors group" href="#" title="NVDA">
          <IoPulseOutline size={20} class="group-hover:text-primary transition-colors" />
        </a>
        <a class="flex flex-col items-center justify-center p-2 rounded-sm text-muted-gray dark:text-outline-variant hover:bg-surface-container-highest dark:hover:bg-on-primary-fixed-variant transition-colors group" href="#" title="MSFT">
          <IoStatsChartOutline size={20} class="group-hover:text-primary transition-colors" />
        </a>
      </nav>
    </aside>
  );
}
