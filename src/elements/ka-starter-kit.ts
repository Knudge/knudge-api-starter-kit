/// <reference lib="dom" />

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { JSONRequestInit } from './ka-starter-kit.types';

import openWindow from '../util/open-window.js';

declare global {
  interface Screen {
    availLeft: number | undefined;
    availTop: number | undefined;
  }
}

const SCOPES: string[] = ['nudges:read'];

const KNUDGE_ORIGIN = process.env.KNUDGE_ORIGIN;

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

      --ka-common-padding: 16px;
      --ka-common-border-radius: 2px;
      --ka-color-primary: rgb(254, 147, 52);
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
      padding: calc(var(--ka-common-padding) / 2) var(--ka-common-padding);
      background: var(--ka-color-primary);
      color: white;
      border-radius: var(--ka-common-border-radius);
    }
  `;

  // PROPERTIES ////////////////////////////////////////////////////////////////

  @state() sessionPromise?: Promise<Object>;

  @state() session?: Object;

  // ACCESSORS /////////////////////////////////////////////////////////////////

  get knudgeURL(): string {
    const url = new URL(`${KNUDGE_ORIGIN}/oauth/authorize`);
    const usp = new URLSearchParams(window.location.search);

    url.searchParams.append(
      'client_id',
      usp.get('client_id') ?? process.env.KNUDGE_CLIENT_ID ?? ''
    );
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', SCOPES.join('+'));

    return url.toString();
  }

  get windowFeatures() {
    const {
      availHeight,
      availLeft = 0,
      availTop = 0,
      availWidth,
    } = window.screen;
    const height = Math.min(availHeight - 60, 600);
    const width = Math.min(availWidth - 60, 425);
    const top = Math.floor(availTop + (availHeight - height) / 4);
    const left = Math.floor(availLeft + (availWidth - width) / 2);

    // Note that we do not need to specify noopener here; other constraints will
    // prevent exposure of opener. This is important because in the context of
    // open(), the presence of noopener actually causes all other features to be
    // ignored.

    return [
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      `width=${width}`,
    ].join();
  }

  // LIFECYCLE /////////////////////////////////////////////////////////////////

  constructor() {
    super();

    this.sessionPromise = fetchAPI(`/session`);
    this.sessionPromise.then(session => {
      this.session = session;
    });

    handleRoute();
  }

  // EVENT HANDLERS ////////////////////////////////////////////////////////////

  handleClickConnectKnudgeAccount(event: MouseEvent) {
    event.preventDefault();
    openWindow(this.knudgeURL, 'knudge', this.windowFeatures);
  }

  // RENDER ////////////////////////////////////////////////////////////////////

  render() {
    return html`
      <main>
        <h1>Knudge API starter app</h1>

        <a
          class="button"
          @click="${this.handleClickConnectKnudgeAccount}"
          href="${this.knudgeURL}"
        >
          Connect Knudge account
        </a>
      </main>

      <p class="app-footer">
        <a href="${KNUDGE_ORIGIN}/api-docs">Knudge API docs</a>
      </p>
    `;
  }
}

async function handleRoute() {
  switch (window.location.pathname) {
    case '/oauth/knudge':
      await oauthInit();
      break;
    default:
  }
}

async function oauthInit() {
  const usp = new URLSearchParams(window.location.search);
  const clientID = usp.get('client_id');
  const code = usp.get('code');

  if (!code) {
    throw new Error('No code param provided in OAuth path');
  }

  const uspClient = new URLSearchParams([
    ...(clientID ? [['client_id', clientID]] : []),
  ]);

  await fetchAPI(`/oauth/knudge${uspClient}`, {
    body: { code },
    method: 'POST',
  });

  window.close();
}

async function fetchAPI(
  path: string,
  { body, method = 'GET', headers, ...init }: JSONRequestInit = {}
) {
  return fetch(`${process.env.URL_API}${path}`, {
    headers: [
      ['accept', 'application/json'],
      ['content-type', 'application/json'],
      ...((headers as []) ?? []),
    ],
    body: body && JSON.stringify(body),
    method,
    ...init,
  });
}
