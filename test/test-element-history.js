import { LitElement, html } from 'lit-element';
import { HistoryListMixin } from '@advanced-rest-client/history-list-mixin/history-list-mixin.js';
import { RequestsListMixin } from '../requests-list-mixin.js';
import styles from '../requests-list-styles.js';
/**
 * @customElement
 * @demo demo/index.html
 * @appliesMixin RequestsListMixin
 * @appliesMixin HistoryListMixin
 */
class TestElementHistory extends RequestsListMixin(HistoryListMixin(LitElement)) {
  static get styles() {
    return styles;
  }
  render() {
    return html`${this.modelTemplate}`;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.type = 'history';
  }
}
window.customElements.define('test-element-history', TestElementHistory);
