Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  post '/api/donate', to: 'api/donations#create'

  # Authentication API
  post '/api/auth/register', to: 'api/auth#register'
  post '/api/auth/login', to: 'api/auth#login'
  post '/api/auth/update-profile', to: 'api/auth#update_profile'

  # Game Account Linking API
  post '/api/game/generate-link-code', to: 'api/game_link#generate_link_code'
  post '/api/auth/link', to: 'api/game_link#link'

  # Discord Authentication & Linking API
  get '/api/auth/discord/url', to: 'api/discord#url'
  post '/api/auth/discord/callback', to: 'api/discord#callback'
  post '/api/auth/discord/sync', to: 'api/discord#sync'
  post '/api/discord/role-update', to: 'api/discord#role_update'

  # Donation Integration API
  post '/api/donations/payos/create', to: 'api/donations#payos_create'
  post '/api/donations/payos/webhook', to: 'api/donations#payos_webhook'
  post '/api/donations/card/submit', to: 'api/donations#card_submit'
  post '/api/donations/card/callback', to: 'api/donations#card_callback'

  # Server Status & Playtime API
  get '/api/server/status', to: 'api/server_status#status'
  post '/api/game/sync-playtime', to: 'api/server_status#sync_playtime'

  # Leaderboards API
  get '/api/leaderboards', to: 'api/leaderboards#index'
  get '/api/supporters/donations', to: 'api/supporters#donations'

  # Test Helpers (Only for local development/Postman testing)
  post '/api/test/payos-signature', to: 'api/donations#payos_signature'
  post '/api/test/card-signature', to: 'api/donations#card_signature'

  # Defines the root path route ("/")
  # root "posts#index"
end
