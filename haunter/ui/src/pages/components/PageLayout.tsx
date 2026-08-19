import { ParentProps } from 'solid-js';
import { TopNavBar } from './TopNavBar';
import { Title } from '@solidjs/meta';

export interface PageLayoutProps extends ParentProps {
  title: string;
  mainClass?: string;
  containerClass?: string;
}

export function PageLayout(props: PageLayoutProps) {

  return (
    <div class={props.containerClass || "flex flex-col min-h-screen font-body-md text-body-md bg-surface text-on-surface antialiased"}>
      <Title>Haunter - {props.title}</Title>

      {/* TopNavBar */}
      <TopNavBar />

      <div class="flex flex-1 overflow-hidden">

        {/* Main Content Area */}
        <main class={props.mainClass || "w-full flex flex-col gap-6 overflow-y-auto p-6"}>
          {props.children}
        </main>
      </div>

      <footer class="border-t border-primary bg-surface py-4 px-8 mt-auto">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="font-label-sm text-label-sm text-muted-gray uppercase tracking-widest">
            SYSTEM STATUS: <span class="text-terminal-green">OPERATIONAL</span>
          </div>
          <div class="font-label-sm text-label-sm text-muted-gray">
            © HAUNTER. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
