Rails.application.routes.draw do
  devise_for :users

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # site root
  root 'home#index'

  get '/about' => 'home#about', as: :about
  get '/advanced' => 'home#advanced', as: :advanced
  get '/make-canned-atlas-template' => 'home#make-canned-atlas-template', as: :make_canned_atlas
  get '/make-geojson-atlas-form' => 'home#make-geojson-atlas-form', as: :make_geojson_atlas

  concern :pageable do
    get '(page/:page)' => :index, on: :collection, as: ''
  end

  resources :atlases, :concerns => :pageable do
    member do
      get ':page_number' => 'pages#show',
        as: :atlas_page,
        constraints: {
          id: /(?:(?!page).)+/ # use negative lookaheads to match anything
                               # *except* page (necessary because concerns
                               # are prioritized lower)
        }
      patch ':page_number' => 'pages#update',
        constraints: {
          id: /(?:(?!page).)+/ # use negative lookaheads to match anything
                               # *except* page (necessary because concerns
                               # are prioritized lower)
        }
    end
  end

  get '/compose' => 'compose#new', as: :compose
  post '/compose' => 'compose#create'

  get '/compose1' => 'compose1#new', as: :compose1
  post '/compose1' => 'compose1#create'

  get '/compose2' => 'compose2#new', as: :compose2
  post '/compose2' => 'compose2#create'

  get '/compose3' => 'compose3#new', as: :compose3
  post '/compose3' => 'compose3#create'

  resources :snapshots, :concerns => :pageable

  mount Rack::NotFound.new("public/404.html") => "activity.php"
end
