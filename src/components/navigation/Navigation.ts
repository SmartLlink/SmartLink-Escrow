/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module manages the data of the navigation menu
 */

 import { Component, Prop, Vue } from 'vue-property-decorator'; // Enables Vue
 import { namespace } from 'vuex-class' // Allows to use vue store in order to get persisted data
 
 const user = namespace('user') // Gets user data from the store
 
 @Component
 export default class Navigation extends Vue {
   // The prop given by the components allowing to hide/show the menu side bar
   @Prop({ default: true, type: Boolean }) drawer: boolean;
 
   @user.State
   public numberOfItems: number;
 
   public navigation: any = [
     { title: 'Market place', icon: 'mdi-shopping', name: 'marketplace' },
     { title: 'Offers', icon: 'mdi-chat', name: 'offers' },
     { title: 'Track orders', icon: 'mdi-cube-send', name: 'orders' },
     { title: 'Admin', icon: 'mdi-crown', name: 'admin' },
     { title: 'Originate contract', icon: 'mdi-note-plus', name: 'originate' },
   ]
 
 }
 