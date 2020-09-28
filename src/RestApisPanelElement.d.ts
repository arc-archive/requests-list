import { LitElement, TemplateResult, CSSResult } from 'lit-element';
import { RestApiListMixin } from './RestApiListMixin.js';

export declare interface RestApisPanelElement extends RestApiListMixin, LitElement {
}

/**
 * The rest apis screen for Advanced REST Client
 */
export declare class RestApisPanelElement {
  static readonly styles: CSSResult[];

  constructor();

  render(): TemplateResult;
}