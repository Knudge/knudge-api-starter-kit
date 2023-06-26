import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

const SCOPES: [string] = [
  'nudges:read'
];

@customElement('ka-starter-kit')
export class KnudgeAPIStarterKit extends LitElement {
  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      font-size: calc(10px + 2vmin);
      color: #1a2b42;
      max-width: 960px;
      margin: 0 auto;
      text-align: center;
      background-color: var(--ka-starter-kit-background-color);
    }

    main {
      flex-grow: 1;
    }

    .app-footer {
      font-size: calc(12px + 0.5vmin);
      align-items: center;
    }

    .app-footer a {
      margin-left: 5px;
    }

    .button {
      all: unset;
      padding: auto;
    }
  `;

  get knudgeURL(): string {
    const url = new URL('https://app.knudge.dev/oauth/authorize');

    url.searchParams.append('client_id', 'TODO');
    url.searchParams.append('response_type', 'code');

    let scopesEncoded = SCOPES
      .map(scope => scope.replace(':', '%3A'))
      .join('+');

    url.searchParams.append('scope', scopesEncoded);

    return url.toString();
  }

  // EVENT HANDLERS ////////////////////////////////////////////////////////////

  handleClickConnectKnudgeAccount() {

  }

  // RENDER ////////////////////////////////////////////////////////////////////

  render() {
    return html`
      <main>
        <h1>Knudge API starter app</h1>

        <a class="button" href="${ this.knudgeURL }">
          Connect knudge account
        </a>
      </main>

      <p class="app-footer">
        <a href="https://app.knudge.com/api-docs">Knudge API docs</a>
      </p>
    `;
  }
}
