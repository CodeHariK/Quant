export function Footer() {
  return (
    <footer class="border-t border-primary bg-surface py-4 px-8 mt-auto">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="font-label-sm text-label-sm text-muted-gray uppercase tracking-widest">
          SYSTEM STATUS: <span class="text-terminal-green">OPERATIONAL</span>
        </div>
        <div class="font-label-sm text-label-sm text-muted-gray">
          © 2024 ALPHA ARENA. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
