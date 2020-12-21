import { html } from 'lit-html';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@advanced-rest-client/arc-models/rest-api-model.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-radio-button/anypoint-radio-button.js';
import '@anypoint-web-components/anypoint-radio-button/anypoint-radio-group.js';
import '@advanced-rest-client/arc-ie/arc-data-export.js';
import { ImportEvents, ArcNavigationEventTypes } from '@advanced-rest-client/arc-events';
import { ArcModelEvents } from '@advanced-rest-client/arc-models'
import '../rest-apis-panel.js';

/** @typedef {import('@advanced-rest-client/arc-events').ARCRestApiNavigationEvent} ARCRestApiNavigationEvent */

class ComponentPage extends DemoPage {
  constructor() {
    super();
    this.initObservableProperties([
      'listType',
    ]);
    this.componentName = 'REST APIs panel';
    this.generator = new DataGenerator();
    this.compatibility = false;
    this.listType = 'default';
    
    this.generateRequests = this.generateRequests.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.listTypeHandler = this.listTypeHandler.bind(this);

    window.addEventListener(ArcNavigationEventTypes.navigateRestApi, this.navigateItemDetailHandler.bind(this));
  }

  async generateRequests() {
    await this.generator.insertApiData({
      size: 100
    });
    ImportEvents.dataImported(document.body);
  }

  async deleteData() {
    await this.generator.destroyAllApiData();
    ArcModelEvents.destroyed(document.body, 'all');
  }

  /**
   * @param {ARCRestApiNavigationEvent} e
   */
  navigateItemDetailHandler(e) {
    console.log('Navigate requested', 'Version', e.version, 'id', e.api, 'Action', e.action);
  }

  listTypeHandler(e) {
    const { name, checked } = e.target;
    if (!checked) {
      return;
    }
    this.listType = name;
  }

  _demoTemplate() {
    const {
      demoStates,
      darkThemeActive,
      compatibility,
      listType,
    } = this;
    return html`
    <section class="documentation-section">
      <h3>Interactive demo</h3>
      <p>
        This demo lets you preview the REST APIs panel with various configuration options.
      </p>
      <arc-interactive-demo
        .states="${demoStates}"
        @state-changed="${this._demoStateHandler}"
        ?dark="${darkThemeActive}"
      >
        <rest-apis-panel
        slot="content"
          ?compatibility="${compatibility}"
          .listType="${listType}"
        ></rest-apis-panel>

        <label slot="options" id="listTypeLabel">List type</label>
        <anypoint-radio-group
          slot="options"
          selectable="anypoint-radio-button"
          aria-labelledby="listTypeLabel"
        >
          <anypoint-radio-button
            @change="${this.listTypeHandler}"
            checked
            name="default"
            >Default</anypoint-radio-button
          >
          <anypoint-radio-button
            @change="${this.listTypeHandler}"
            name="comfortable"
            >Comfortable</anypoint-radio-button
          >
          <anypoint-radio-button
            @change="${this.listTypeHandler}"
            name="compact"
            >Compact</anypoint-radio-button
          >
        </anypoint-radio-group>
      </arc-interactive-demo>
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
      <anypoint-button @click="${this.deleteData}">Clear list</anypoint-button>
    </section>`;
  }

  contentTemplate() {
    return html`
      <rest-api-model></rest-api-model>
      <h2>REST APIs panel</h2>
      ${this._demoTemplate()}
      ${this._controlsTemplate()}
    `;
  }
}
const instance = new ComponentPage();
instance.render();
