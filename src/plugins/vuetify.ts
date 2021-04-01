/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module allows to use Vuetify bootstrap
 */
import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
    theme: { themes:{ light: { background : '#f8f9fd', primary: '#5a6099', forward: '#7128fc', back:'#454052', main: '#662cf2', initialized:"#ecadd0", finished:"#afffda", shipped:"#ffe494", 'v-divider': '#ffffff6e'}} },
  })