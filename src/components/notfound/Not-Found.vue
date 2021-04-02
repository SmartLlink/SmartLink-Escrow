<template>
  <v-app :style="{ background: $vuetify.theme.themes.light.background }">
   <Navigation :drawer="drawer"></Navigation>
   <v-app-bar
      app
      :style="{ background: $vuetify.theme.themes.light.background }"
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>404 NOT FOUND</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="running-contract">
        Running contract:
        <code>{{ this.$store.state.contract.contractAddress }}</code>
      </span>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-alert type="error">
          404: The requested page does not exist
        </v-alert>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" src="./Not-Found.ts"></script>
<style lang="scss" scoped src="./not-found.scss"></style>
