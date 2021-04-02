<template>
  <v-app :style="{ background: $vuetify.theme.themes.light.background }">
    <Navigation :drawer="drawer"></Navigation>
    <v-app-bar
      app
      :style="{ background: $vuetify.theme.themes.light.background }"
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title v-if="isItemAvailable && loaded">{{ this.$route.name}} n° {{ data.id }}</v-toolbar-title>
      <v-toolbar-title v-else-if="!isItemAvailable && loaded">Item unavailable</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="running-contract"
        >Running contract:
        <code>{{ this.$store.state.contract.contractAddress }}</code></span
      >
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <div
          class="items"
          v-if="
            isItemAvailable &
            loaded &
            !isPaymentInProcess &
            !isPaymentSuccessful &
            !paymentFailed
          "
        >
          <h1 class="title" v-if="this.$route.name === 'Buy item' || this.$route.name === 'Offer'">{{ this.$route.name }} n°{{ data.id }}</h1>
          <h1 class="title" v-else>Track the order n°{{ data.id }}</h1>
          <section class="required-action" v-if="data.state.action.required">
            
                {{ data.state.action.required}}
              
          </section>
        
          <br v-else />

          <v-row justify="space-between">
            <v-col
              lg="8"
              md="12"
              cols="12"
              class="d-flex"
              style="flex-direction: column"
            >
              <section class="item flex-grow-1">
                <v-row align="center">
                  <v-col cols="auto"
                    ><v-chip class="chip" :color="`${data.state.name}`">
                      {{ data.state.action.short_description }}
                    </v-chip></v-col
                  >
                  <v-spacer></v-spacer>
                  <v-col cols="auto">
                    <span class="seller">Sold by: {{ data.seller }}</span>
                  </v-col>
                </v-row>
                <v-row align="center" class="banner">
                  <v-col cols="auto">
                    <img
                      :src="require(`../../assets/${data.picture}`)"
                      aspect-ratio="1"
                      width="55px"
                    />
                  </v-col>
                  <v-col cols="auto"
                    ><span class="name">{{ data.name }}</span
                    ><br /><span class="date"
                      >Created on
                      {{ new Date(data.date).toLocaleString() }}</span
                    ></v-col
                  >
                </v-row>
                <section class="description">
                  {{ info[data.escrow_type].description }}
                </section>
              </section>
            </v-col>
            <v-col
              lg="4"
              md="12"
              cols="12"
              class="d-flex"
              style="flex-direction: column"
            >
              <section class="prices flex-grow-1">
               
                  <h2 class="overline">{{ info[data.escrow_type].name  }}</h2>
                
                <hr />
                <v-row justify="space-between">
                  <v-col cols="auto"
                    ><h2>Subtotal</h2></v-col
                  >
                  <v-col cols="auto"
                    ><span class="price">{{ data.price }} </span>
                    <img :src="require(`../../assets/tezos.png`)" width="7px"
                  /></v-col>
                </v-row>

                <v-row justify="space-between">
                  <v-col cols="auto"
                    ><h2>Shipping</h2></v-col
                  >
                  <v-col cols="auto"
                    ><span class="price">{{ data.shipping }} </span>
                    <img :src="require(`../../assets/tezos.png`)" width="7px"
                  /></v-col>
                </v-row>

                <v-row justify="space-between">
                  <v-col cols="auto"><h2>Fees</h2></v-col>
                  <v-col cols="auto"
                    ><span class="price">{{ data.fees }} </span>
                    <img :src="require(`../../assets/tezos.png`)" width="7px"
                  /></v-col>
                </v-row>
                <hr />

                <v-row justify="space-between" class="total">
                  <v-col cols="auto"><h2>Total</h2></v-col>
                  <v-col cols="auto"
                    ><span class="price">{{ data.total }} </span>
                    <img :src="require(`../../assets/tezos.png`)" width="7px"
                  /></v-col>
                </v-row>
              </section>
            </v-col>
          </v-row>         
         <section class="navigation-buttons text-right">  <v-btn 
                    depressed
                    rounded
                    color="red"
                    class="buy"
                    v-if="data.state.action.name === 'Begin escrow'"
                    
                    :href="/offers/"
                    @click="removeItem(data.id)"
                  >
                   Remove
                  </v-btn> <v-btn depressed color="forward" v-if="data.state.action.name" rounded @click="action(data.state.action.action)" >
                  {{data.state.action.name}} <v-icon right>mdi-chevron-right-circle</v-icon></v-btn
                >
                </section>
        </div>
        <v-alert v-if="!isItemAvailable & loaded" type="error">
          404: The requested item does not exist
        </v-alert>
        <div
          v-if="isPaymentInProcess && !paymentFailed && !isPaymentSuccessful"
          class="text-center items"
        >
          <v-progress-circular
            :size="200"
            :width="10"
            color="primary"
            indeterminate
          >
            {{this.data.state.progress}}
          </v-progress-circular>
        </div>
        <v-alert type ="error" dismissible v-if="paymentFailed || error">
          {{ error_msg }}
        </v-alert>
        <div v-if="paymentFailed" class="items text-center">
           <v-icon
              :size="125"
              color="back"
           >
            mdi-close
            </v-icon>
            <span class="headline" color="primary">{{this.data.state.failure}}</span>
            <section class="navigation-buttons">
              <v-row align="center" justify="center">
                <v-col cols="auto">
                  <v-btn depressed color="back" rounded :to="{name: data.state.back}"> <v-icon left>mdi-cart-variant</v-icon> Back to {{data.state.back}} </v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn depressed color="forward" rounded @click="action(data.state.action.action)"><v-icon left>mdi-restart</v-icon> Try again </v-btn>
                </v-col>
              </v-row>
            </section>
          </div>
        <div v-if="isPaymentSuccessful && !isPaymentInProcess" class="paymentSuccessful text-center">
          <v-row justify="space-between" align="center">
            <v-col lg="5" md="12" cols="12">
              <v-icon :size="100" color="primary"> mdi-check-bold </v-icon>
              <br />
              <span class="headline">{{this.data.state.success}}</span>
              <br />
             
            </v-col>
            <v-col lg="7" md="12" cols="12">
              <section class="prices">
                <v-row justify="space-between">
                  <v-col cols="auto"><h2 class="overline">Summary</h2></v-col>
                  <v-col cols="auto">
                     <span class="overline"
                >You placed {{ data.total }}
                <img :src="require(`../../assets/tezos.png`)" width="8px" />
                in escrow</span
              >
                  </v-col>
                </v-row>
                <hr />
                <v-row justify="space-between">
                  <v-col cols="auto"
                    ><h2>Subtotal</h2></v-col
                  >
                  <v-col cols="auto"
                    ><span class="price">{{ data.price }} </span>
                    <img :src="require(`../../assets/tezos.png`)" width="7px"
                  /></v-col>
                </v-row>

                <v-row justify="space-between">
                  <v-col cols="auto"
                    ><h2>Shipping</h2></v-col
                  >
                  <v-col cols="auto"
                    ><span class="price">{{ data.shipping }} </span>
                    <img :src="require(`../../assets/tezos.png`)" width="7px"
                  /></v-col>
                </v-row>

                <v-row justify="space-between">
                  <v-col cols="auto"><h2>Fees</h2></v-col>
                  <v-col cols="auto"
                    ><span class="price">{{ data.fees }} </span>
                    <img :src="require(`../../assets/tezos.png`)" width="7px"
                  /></v-col>
                </v-row>
                <hr />

                <v-row justify="space-between" class="total">
                  <v-col cols="auto"><h2>Total</h2></v-col>
                  <v-col cols="auto"
                    ><span class="price">{{ data.total }}</span>
                    <img :src="require(`../../assets/tezos.png`)" width="7px"
                  /></v-col>
                </v-row>
              </section>
            </v-col>
          </v-row>
           <br />
          <v-btn depressed color="forward" rounded :to="{name: data.state.back}">
            <v-icon left>mdi-cart-variant</v-icon> Go back to {{data.state.back}}
          </v-btn>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" src="./View-item.ts"></script>
<style lang="scss" scoped src="./view-item.scss"></style>
