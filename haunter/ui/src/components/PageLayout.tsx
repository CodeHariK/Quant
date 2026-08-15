import { JSX, ParentProps } from 'solid-js';
import { TopNavBar } from './TopNavBar';
import { SideNavBar } from './SideNavBar';
import { Footer } from './Footer';

export interface PageLayoutProps extends ParentProps {
  showSidebar?: boolean;
  statusText?: string;
  mainClass?: string;
  containerClass?: string;
}

export function PageLayout(props: PageLayoutProps) {
  const showSidebar = () => props.showSidebar !== false;

  return (
    <div class={props.containerClass || "flex flex-col min-h-screen font-body-md text-body-md bg-surface text-on-surface antialiased"}>
      {/* TopNavBar */}
      <TopNavBar />

      <div class="flex flex-1 overflow-hidden">
        {/* Optional SideNavBar */}
        {showSidebar() && <SideNavBar />}

        {/* Main Content Area */}
        <main class={props.mainClass || "flex-1 p-8 overflow-y-auto"}>
          {props.children}
        </main>
      </div>

      {/* Footer */}
      <Footer statusText={props.statusText} />
    </div>
  );
}
