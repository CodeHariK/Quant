import { Accessor } from 'solid-js';
import { Card } from '../../../primitives/Card';
import { Input, FilledButton, OutlineButton } from '../../../primitives/FormControls';
import { Text } from '../../../primitives/Text';

export interface KiteConnectBannerProps {
  kiteAuth: Accessor<boolean>;
  authError: Accessor<string | null>;
  apiKeyInput: Accessor<string>;
  apiSecretInput: Accessor<string>;
  setApiKeyInput: (v: string) => void;
  setApiSecretInput: (v: string) => void;
  getKiteLoginUrl: () => string;
  loadPortfolio: (force: boolean) => void;
  handleKiteLogout: () => void;
}

export function KiteConnectBanner(props: KiteConnectBannerProps) {
  return (
    <>
      {!props.kiteAuth() ? (
        <Card containerClass="border border-outline-variant bg-surface p-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-outline-variant pb-4">
            <div>
              <Text variant="h2" class="flex items-center gap-2">
                <Text>ZERODHA KITECONNECT INTEGRATION</Text>
              </Text>
              <Text variant="muted" class="mt-1 block">
                Authenticate with your Zerodha KiteConnect API key to load live equity holdings, position P&L, and executed trade logs.
              </Text>
            </div>
            <a
              href="https://kite.trade/"
              target="_blank"
              class="border border-outline-variant px-3 py-1 font-label-caps text-label-caps hover:bg-surface-container-highest uppercase"
            >
              KITE DEVELOPER CONSOLE ↗
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input
              label="API KEY"
              type="text"
              placeholder="e.g. 12345xyz"
              value={props.apiKeyInput()}
              onInput={(e) => {
                const val = e.currentTarget.value;
                props.setApiKeyInput(val);
                localStorage.setItem('haunter_kite_api_key', val.trim());
              }}
              required
            />
            <Input
              label="API SECRET"
              type="password"
              placeholder="e.g. secretabc..."
              value={props.apiSecretInput()}
              onInput={(e) => {
                const val = e.currentTarget.value;
                props.setApiSecretInput(val);
                localStorage.setItem('haunter_kite_api_secret', val.trim());
              }}
              required
            />
            <div class="flex items-center">
              {props.apiKeyInput().trim() && props.apiSecretInput().trim() ? (
                <a href={props.getKiteLoginUrl()} target="_blank" class="w-full">
                  <FilledButton class="w-full py-3">
                    LOGIN WITH ZERODHA 🔑 ↗
                  </FilledButton>
                </a>
              ) : (
                <OutlineButton disabled class="w-full py-3 opacity-50 cursor-not-allowed">
                  Enter Key & Secret to Login
                </OutlineButton>
              )}
            </div>
          </div>
          {props.authError() && <div class="font-code-md text-code-md text-critical-red mt-3">{props.authError()}</div>}
        </Card>
      ) : (
        <Card containerClass="border border-outline-variant bg-surface p-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-terminal-green inline-block border border-outline-variant"></span>
              <Text variant="h3" class="text-xs">ZERODHA KITECONNECT CONNECTED (PERSISTED IN BOLTDB)</Text>
            </div>
            <div class="flex items-center gap-2">
              <OutlineButton onClick={() => props.loadPortfolio(true)} size="sm">
                FORCE REFRESH 🔄
              </OutlineButton>
              <OutlineButton onClick={props.handleKiteLogout} size="sm" class="border-critical-red text-critical-red">
                LOGOUT 🚪
              </OutlineButton>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
