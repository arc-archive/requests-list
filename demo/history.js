
import { html } from 'lit-html';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@advanced-rest-client/arc-models/request-model.js';
import '@advanced-rest-client/arc-models/url-indexer.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import { ImportEvents } from '@advanced-rest-client/arc-events';
import './history-screen.js';

class ComponentPage extends DemoPage {
  constructor() {
    super();
    this.initObservableProperties([
      'data'
    ]);
    this.componentName = 'History list';
    this.generator = new DataGenerator();

    this.generateRequests = this.generateRequests.bind(this);
  }

  async generateRequests() {
    await this.generator.insertHistoryRequestData({
      requestsSize: 100,
    });
    ImportEvents.dataimported(document.body);
  }

  _demoTemplate() {
    return html`
    <section class="documentation-section">
      <h3>Interactive demo</h3>
      <p>
        This demo lets you preview the history list mixins and UI with various configuration options.
      </p>
      <history-screen></history-screen>
    </section>
    `;
  }

  _controlsTemplate() {
    return html`
    <section class="documentation-section">
      <h3>Data control</h3>
      <p>
        This section allows you to control demo data
      </p>
      <anypoint-button @click="${this.generateRequests}">Generate 100 requests</anypoint-button>
    </section>`;
  }

  contentTemplate() {
    return html`
      <request-model></request-model>
      <url-indexer></url-indexer>
      <h2>History list</h2>
      ${this._demoTemplate()}
      ${this._controlsTemplate()}
    `;
  }
}
const instance = new ComponentPage();
instance.render();