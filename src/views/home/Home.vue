<template>
  <v-app :style="{ background: $vuetify.theme.themes.light.background }">
    <v-main>
      <v-container fill-height fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="8">
            <v-card class="elevation-12">
              <v-row>
                <v-col cols="12" md="4" class="primary prerequisites">
                  <v-card-text class="white--text mt-12">
                    <h4 class="overline">Start your journey with us!</h4>
                    <h1 class="display-1">SmartLink demo</h1>
                    <v-divider></v-divider>
                    <h6 class="title">Prerequisites</h6>
                    <div class="subitems">
                      <div class="subitems-title">
                        <v-icon left color="white">mdi-wallet</v-icon>
                        <span class="subtitle-1">Compatible wallet</span>
                      </div>
                      <p>One of the following wallets is required:</p>
                      <v-row dense>
                        <v-col
                          v-for="n in Object.keys(wallets).length"
                          :key="n"
                          class="d-flex child-flex justify-center text-center"
                          cols="2"
                          md="4"
                        >
                          <a :href="`${wallets[n]}`">
                            <img
                              :src="require(`../../assets/${n}.png`)"
                              aspect-ratio="1"
                              width="55px"
                              class="wallet"
                            />
                          </a>
                        </v-col>
                      </v-row>
                    </div>
                    <br />
                    <div class="subitems">
                      <div class="subitems-title">
                        <v-icon left color="white">mdi-account-check</v-icon>
                        <span class="subtitle-1">Tezos Delphinet account</span>
                      </div>
                    </div>
                    <div class="text-center">
                      <v-btn depressed color="white" rounded @click="step++">
                        <v-icon left>mdi-information</v-icon> More information
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-col>
                <v-col cols="12" md="8">
                  <v-card-text class="mt-12">
                    <section class="category">
                      <h4 class="title">Originate your own escrow contract!</h4>
                      <hr />
                      <p>
                        In order to fully experience all the SmartLink demo
                        features, you need to originate the demo contract. The
                        origination may take a minute.
                      </p>
                      <br />
                      <div class="text-center">
                        <v-btn
                          v-if="!originating && !originatingCompleted"
                          depressed
                          color="forward"
                          rounded
                          v-on:click="originateContract"
                        >
                          Originate contract
                        </v-btn>

                        <div class="loading" v-if="originating">
                          <v-progress-circular
                            indeterminate
                            color="primary"
                          ></v-progress-circular
                          ><span class="subtitle-1"> Originating...</span>
                        </div>

                        <div v-if="originatingCompleted">
                          <p>
                            Your contract address:
                            <code>{{ contractAddress }}</code>
                          </p>
                          <v-btn
                            depressed
                            color="forward"
                            rounded
                            :href="`/marketplace/`"
                          >
                            Go to escrow
                          </v-btn>
                        </div>
                      </div>
                    </section>
                    <v-alert v-model="error" dismissible type="error">
                      {{ error_msg }}
                    </v-alert>

                    <section class="category">
                      <h4 class="title">
                        Already have a SmartLink contract? Run it!
                      </h4>
                      <hr />
                      <p>
                        If you have previously originated a SmartLink Escrow
                        contract, please enter it bellow:
                      </p>
                      <br />
                      <v-text-field
                        label="Contract address"
                        placeholder="Smartlink escrow contract address"
                        filled
                        rounded
                        dense
                        v-model="contractAddress"
                      >
                      </v-text-field>
                      <div class="text-center">
                        <v-btn
                          v-if="!loadingContract"
                          depressed
                          color="forward"
                          rounded
                          type="submit"
                          :disabled="contractAddress.length < 1"
                          @click="openContract()"
                        >
                          Run contract
                        </v-btn>
                        <div class="loading" v-if="loadingContract">
                          <v-progress-circular
                            indeterminate
                            color="primary"
                          ></v-progress-circular>
                          <span class="subtitle-1"
                            >Loading contract information...</span
                          >
                        </div>
                      </div>
                    </section>
                  </v-card-text>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style lang="scss" scoped src="./home.scss"></style>
<script lang="ts" src="./Home.ts"></script>
