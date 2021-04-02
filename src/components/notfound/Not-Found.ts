/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module displays the not found page
 */

// Vue
import { Component, Vue } from 'vue-property-decorator'; // enables vue
import Navigation from "../navigation/Navigation.vue" // Navigation side bar menu

@Component({
  components: {
    Navigation
  },
})
export default class NotFound extends Vue {
  // Booleans for the display
  public drawer: boolean = true; // Open or close the navigation side bar

}
