import { LitElement, html } from 'lit-element';
import { SavedListMixin } from '@advanced-rest-client/saved-list-mixin/saved-list-mixin.js';
import { RequestsListMixin } from '../requests-list-mixin.js';
import styles from '../requests-list-styles.js';
/**
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @appliesMixin RequestsListMixin
 * @appliesMixin SavedListMixin
 */
class TestElementSaved extends RequestsListMixin(SavedListMixin(LitElement)) {
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
    this.type = 'saved';
  }
}
window.customElements.define('test-element-saved', TestElementSaved);
