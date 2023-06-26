import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import type { KnudgeAPIStarterKit } from '../src/ka-starter-kit.js';
import '../src/ka-starter-kit.js';

describe('KaStarterKit', () => {
  let element: KnudgeAPIStarterKit;
  beforeEach(async () => {
    element = await fixture(html`<ka-starter-kit></ka-starter-kit>`);
  });

  it('renders a h1', () => {
    const h1 = element.shadowRoot!.querySelector('h1')!;
    expect(h1).to.exist;
    expect(h1.textContent).to.equal('Knudge API starter app');
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
