/// <reference lib="dom" />

import { LitElement, html, css } from 'lit';
import { until } from 'lit/directives/until.js';
import { customElement, state } from 'lit/decorators.js';

import { JSONRequestInit } from './ka-starter-kit.types';

import openWindow from '../util/open-window.js';

declare global {
  interface Screen {
    availLeft: number | undefined;
    availTop: number | undefined;
  }
}

// These are the scopes required for this example app to display what it does.
// Your app's required scopes may differ!
const SCOPES: string[] = [
  'contacts:read',
  'members:read',
  'nudges:read',
  'organizations:read',
];

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
      font-size: calc(8px + 2vmin);
      color: #1a2b42;
      max-width: min(100vw, 960px);
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
      font-size: calc(10px + 0.5vmin);
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

    a {
      color: var(--ka-color-primary);
    }

    pre {
      font-size: calc(12px + 1vmin);
    }

    table th {
      font-size: calc(12px + 1vmin);
      text-align: start;
    }

    table tbody tr {
      border-top: 1px solid black;
    }

    table td {
      font-size: calc(12px + 0.8vmin);
      padding: 6px;
      text-align: start;
    }
  `;

  // PROPERTIES ////////////////////////////////////////////////////////////////

  @state()
  connecting: boolean = false;

  @state()
  contactsPromise?: Promise<any>;

  @state()
  membersPromise?: Promise<any>;

  @state()
  sessionPromise?: Promise<any>;

  @state()
  session?: any;

  @state()
  organizationPromise?: Promise<any>;

  @state()
  socket: WebSocket | null = null;

  // ACCESSORS /////////////////////////////////////////////////////////////////

  get clientID() {
    const usp = new URLSearchParams(window.location.search);
    return usp.get('client_id') || process.env.KNUDGE_CLIENT_ID || '';
  }

  get knudgeURL(): string {
    const usp = new URLSearchParams(window.location.search);
    const url = new URL(`${KNUDGE_ORIGIN}/oauth/authorize`);
    const { clientID } = this;

    if (clientID) {
      url.searchParams.append('client_id', clientID);
    }

    url.searchParams.append('response_type', 'code');
    let scopes = usp.getAll('scope');

    if (!scopes.length) {
      scopes = SCOPES;
    }

    url.searchParams.append('scope', scopes.join(' '));

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

    this.fetchSession();
    this.handleRoute();
  }

  connectedCallback(): void {
    super.connectedCallback?.();
    window.addEventListener('focus', this.handleFocus);
    if (new URLSearchParams(window.location.search).has('code_only'))
      sessionStorage.setItem('code_only', 'true');
  }

  disconnectedCallback(): void {
    super.disconnectedCallback?.();
    window.removeEventListener('focus', this.handleFocus);
  }

  // EVENT HANDLERS ////////////////////////////////////////////////////////////

  async handleClickConnectKnudgeAccount(event: MouseEvent) {
    event.preventDefault();
    this.connecting = true;
    await openWindow(this.knudgeURL, 'knudge', this.windowFeatures);
  }

  async handleClickDisconnect() {
    const { clientID } = this;
    const uspClient = new URLSearchParams([
      ...(clientID ? [['client_id', clientID]] : []),
    ]);
    await fetchAPI(`/session?${uspClient}`, {
      method: 'DELETE',
    });
    this.contactsPromise = undefined;
    this.membersPromise = undefined;
    this.organizationPromise = undefined;
    this.session = null;
    this.sessionPromise = new Promise(r => r(null));
  }

  handleFocus = async () => {
    if (!this.session && this.connecting) {
      this.connecting = false;
      await this.fetchSession();
    }
  };

  async handleRoute() {
    switch (window.location.pathname) {
      case '/webhook-passthrough':
        await this.webhookInit();
        break;
      case '/oauth/knudge':
        await this.oauthInit();
        break;
      default:
    }
  }

  // API ///////////////////////////////////////////////////////////////////////

  async fetchSession() {
    const { clientID } = this;
    const uspClient = new URLSearchParams([
      ...(clientID ? [['client_id', clientID]] : []),
    ]);

    this.sessionPromise = fetchAPIJSON(`/session?${uspClient}`);

    this.sessionPromise.then(session => {
      this.session = session;
    });

    this.organizationPromise = this.sessionPromise.then(
      session =>
        session?.organization &&
        fetchAPIJSON(`/passthrough/v1/organization/${session.organization}`)
    );

    this.contactsPromise = this.sessionPromise.then(session => {
      if (!session?.organization) return null;

      const usp = new URLSearchParams([['relationship', 'contact']]);
      return fetchAPIJSON(
        `/passthrough/v1/organization/${session.organization}/user?${usp}`
      );
    });

    this.membersPromise = this.sessionPromise.then(session => {
      if (!session?.organization) return null;
      const usp = new URLSearchParams([['relationship', 'member']]);
      return fetchAPIJSON(
        `/passthrough/v1/organization/${session.organization}/user?${usp}`
      );
    });
  }

  async oauthInit() {
    const usp = new URLSearchParams(window.location.search);
    const code = usp.get('code');

    if (!code) {
      throw new Error('No code param provided in OAuth path');
    }

    if (sessionStorage.getItem('code_only')) {
      // Allow a user or automated test to grab the code from the URL
      return;
    }

    const { clientID } = this;
    const uspClient = new URLSearchParams([
      ...(clientID ? [['client_id', clientID]] : []),
    ]);

    const result = await fetchAPI(`/oauth/knudge?${uspClient}`, {
      body: { code },
      method: 'POST',
    });

    if (result.ok) {
      window.close();
    }
  }

  async webhookInit() {
    const usp = new URLSearchParams(window.location.search);
    const name = usp.get('name');

    this.socket = new WebSocket(`wss://${location.host}/ws`);

    this.socket.send(
      JSON.stringify({
        type: 'webhook-open',
        name,
      })
    );

    this.socket.addEventListener('open', event => {
      console.log('WebSocket connection established');
    });

    this.socket.addEventListener('message', event => {
      const data = JSON.parse(event.data);
      const detail = { data };
      console.log('Message from server:', data.name ?? 'unnamed event', data);
      dispatchEvent(new CustomEvent('ws-message-webhook', { detail }));

      if (data.name)
        dispatchEvent(new CustomEvent(`ws-message-${data.name}`, { detail }));
    });

    this.socket.addEventListener('close', event => {
      this.socket = null;
      console.log('WebSocket connection closed', event.code, event.reason);
    });

    this.socket.addEventListener('error', event => {
      this.socket = null;
      console.error('WebSocket error:', event);
    });
  }

  // RENDER ////////////////////////////////////////////////////////////////////

  render() {
    return html`
      <main>
        <h1>Knudge API starter app</h1>

        ${this.renderAction()} ${this.renderContacts()} ${this.renderMembers()}
      </main>

      <p class="app-footer">
        <a href="${KNUDGE_ORIGIN}/api-docs">Knudge API docs</a>
      </p>
    `;
  }

  renderAction() {
    return until(
      this.sessionPromise
        ?.then(session => {
          if (!session) {
            return html`
              <a
                class="button"
                @click="${this.handleClickConnectKnudgeAccount}"
                href="${this.knudgeURL}"
              >
                Connect Knudge account
              </a>
            `;
          }

          const { firstName, id, lastName } = this.session;
          return html`
            <p>Connected as ${firstName} ${lastName} — <code>${id}</code></p>
            <button class="button" @click="${this.handleClickDisconnect}">
              Disconnect
            </button>
            ${this.renderOrganization()}
          `;
        })
        .catch(err => html` <pre>${err}</pre> `),
      'Loading...'
    );
  }

  renderContacts() {
    return html`
      <h2>Contacts</h2>
      ${until(
        this.contactsPromise
          ?.then(contacts =>
            contacts
              ? html`
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${contacts.map(
                        (contact: any) => html`
                          <tr>
                            <td><pre>${contact.id}</pre></td>
                            <td>${contact.emailAddressPrimary}</td>
                            <td>${contact.firstName} ${contact.lastName}</td>
                          </tr>
                        `
                      )}
                    </tbody>
                  </table>
                `
              : html` <em>Connect to load contacts</em> `
          )
          .catch(err => html` <pre>${err}</pre> `)
      )}
    `;
  }

  renderMembers() {
    return html`
      <h2>Members</h2>
      ${until(
        this.membersPromise
          ?.then(members =>
            members
              ? html`
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${members.map(
                        (member: any) => html`
                          <tr>
                            <td><pre>${member.id}</pre></td>
                            <td>${member.emailAddressPrimary}</td>
                            <td>${member.firstName} ${member.lastName}</td>
                          </tr>
                        `
                      )}
                    </tbody>
                  </table>
                `
              : html` <em>Connect to load members</em> `
          )
          .catch(err => html` <pre>${err}</pre> `)
      )}
    `;
  }

  renderOrganization() {
    return until(
      this.organizationPromise
        ?.then(organization => {
          if (!organization) {
            return '';
          }

          const { id, name } = organization;
          return html`<p>Member of ${name} — <code>${id}</code></p>`;
        })
        .catch(err => html` <pre>${err}</pre> `) ?? '',
      'Org loading...'
    );
  }
}

async function fetchAPI(
  path: string,
  { body, method = 'GET', headers, ...init }: JSONRequestInit = {}
): Promise<Response> {
  return fetch(`${process.env.URL_API}${path}`, {
    credentials: 'include',
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

async function fetchAPIJSON(
  path: string,
  opts?: JSONRequestInit
): Promise<any> {
  const response = await fetchAPI(path, opts);

  if (!response?.ok) {
    if (response.status === 404) {
      return null;
    }

    let json;

    try {
      json = await response.json();
    } catch (err) {
      console.error(err);
    }

    throw new Error(
      `Failed to fetch\n` +
        `"${path}"\n` +
        `${response?.status} ${response?.statusText}\n` +
        `${json?.message ?? ''}`
    );
  }

  try {
    return response.json();
  } catch (err: any) {
    console.error(err);
    throw err;
  }
}
