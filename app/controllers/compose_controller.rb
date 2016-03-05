require "geocoder"
require "providers"
require "json"
require "geo"
require "csv"

class ComposeController < ApplicationController
  @@cities = nil

  layout "big_map"

  # allow existing forms (w/o CSRF projection) to create canned atlases
  skip_before_filter :verify_authenticity_token, only: :create

  def new
    @atlas = Atlas.new
    @initial_lat, @initial_lon, @initial_zoom = initial_center

    # Convert params into a form that ActiveRecord likes (retaining old input
    # names)
    if params[:atlas_location]
<<<<<<< HEAD
      puts params
=======
>>>>>>> master
      new_params = {}
      new_params[:lat], new_params[:lon], new_params[:zoom] =
        params[:atlas_location].split(/,\s*| /).map(&:strip)
      new_params[:zoom] ||= 12 # arbitrary zoom
      if !params[:atlas_title].empty?
        new_params[:title] = params[:atlas_title]
      end
      if !params[:atlas_text].empty?
        new_params[:text] = params[:atlas_text]
      end
      if !params[:atlas_provider].empty?
        new_params[:provider] = params[:atlas_provider]
      end
      redirect_to compose_path(new_params)
    end
  end

  def create
<<<<<<< HEAD
    # TODO: figure out how to calculate rows & columns
    # TODO: how to handle providers & zooms for pages ("features")
    if params[:geojson_data]
      process_geojson
      return redirect_to compose_path
    end

    # geojson file
    if params[:geojson_file]
      return redirect_to compose_path
    end

    # Nasty: force numeric conversion of numeric strings in parameters
    # from client...
    @atlas = Atlas.new (Atlas.new atlas_params).attributes
    @atlas.layout = @atlas.layout == 1 ? "half-page" : "full-page"
    @atlas.save!

    if @atlas.valid?
      @atlas.render!

=======
    # geojson file
    if params[:geojson_file]
      params[:geojson_data] = params[:geojson_file].read
      return redirect_to compose_path(process_geojson)
    end

    # TODO: figure out how to calculate rows & columns
    # TODO: how to handle providers & zooms for pages ("features")
    if params[:geojson_data]
      return redirect_to compose_path(process_geojson)
    end

    # Nasty: force numeric conversion of numeric strings in parameters
    # from client...
    @atlas = Atlas.new (Atlas.new atlas_params).attributes
    @atlas.layout = @atlas.layout == 1 ? "half-page" : "full-page"

    if @atlas.valid?
      @atlas.save!
      @atlas.render!
>>>>>>> master
      return redirect_to atlas_path(@atlas)
    end

    redirect_to compose_path
  end

<<<<<<< HEAD
=======
  def update
    # Nasty: force numeric conversion of numeric strings in parameters
    # from client...
    @atlas = Atlas.new (Atlas.new atlas_params).attributes
    @atlas.layout = @atlas.layout == 1 ? "half-page" : "full-page"

    if @atlas.valid?
      @atlas.save!
      @atlas.render!
      return redirect_to atlas_path(@atlas)
    end

    redirect_to compose_path
  end

>>>>>>> master
  private

  def process_geojson
    # params[:geojson_data] is a String,
    # so need to convert to JSON
    geojson = JSON.parse(params[:geojson_data])

    # TODO: need to validate geojson

<<<<<<< HEAD
    props = geojson['properties']


    # TODO: need to validate geojson props
    params[:atlas] = {
=======
    props = geojson['properties'] || {}


    # TODO: need to validate geojson props
    new_params = {
>>>>>>> master
      title: props['title'] || '',
      text: props['description'] || '',
      paper_size: props['paper_size'] || 'letter',
      orientation: props['orientation'] || 'landscape',
      layout: props['layout'] || 'full-page',
      utm_grid: props['utm_grid'] || false,
      redcross_overlay: props['redcross_overlay'] || false,
      zoom: props['zoom'] || 16,
<<<<<<< HEAD
      provider: Providers.layers[Providers.default.to_sym][:template],
=======
      provider: Providers.layers[Providers.default][:template],
>>>>>>> master
      west: nil,
      south: nil,
      east: nil,
      north: nil,
      rows: 0,
      cols: 0
    }

    templates = []
<<<<<<< HEAD

    for feature in geojson['features']
      b = nil
      p = feature['properties']

      templates.push(p['provider'] || Providers.layers[Providers.default.to_sym][:template])
=======

    for feature in geojson['features']
      b = nil
      p = feature['properties']

      templates.push(p['provider'] || Providers.layers[Providers.default][:template])
>>>>>>> master
      zoom = p['zoom'] || 16

      if feature['geometry']['type'] == 'Point'
        b = point_extent(feature['geometry']['coordinates'], zoom, [1200, 1200])
      elsif feature['geometry']['type'] == 'Polygon'
        b = polygon_extent(feature['geometry']['coordinates'])
      else
        # skip
      end

      if !b.nil?
<<<<<<< HEAD
        if params[:atlas][:west].nil?
          params[:atlas][:west] = b[0]
        else
          params[:atlas][:west] = [params[:atlas][:west], b[0]].min
        end

        if params[:atlas][:east].nil?
          params[:atlas][:east] = b[2]
        else
          params[:atlas][:east] = [params[:atlas][:east], b[2]].max
        end

        if params[:atlas][:north].nil?
          params[:atlas][:north] = b[3]
        else
          params[:atlas][:north] = [params[:atlas][:north], b[3]].max
        end

        if params[:atlas][:south].nil?
          params[:atlas][:south] = b[1]
        else
          params[:atlas][:south] = [params[:atlas][:south], b[1]].min
        end
      end
    end
=======
        if new_params[:west].nil?
          new_params[:west] = b[0]
        else
          new_params[:west] = [new_params[:west], b[0]].min
        end

        if new_params[:east].nil?
          new_params[:east] = b[2]
        else
          new_params[:east] = [new_params[:east], b[2]].max
        end

        if new_params[:north].nil?
          new_params[:north] = b[3]
        else
          new_params[:north] = [new_params[:north], b[3]].max
        end

        if new_params[:south].nil?
          new_params[:south] = b[1]
        else
          new_params[:south] = [new_params[:south], b[1]].min
        end
      end
    end
    if not new_params[:south].nil? and not new_params[:north].nil?
      new_params[:lat] = (new_params[:south] + new_params[:north]) / 2
    end
    if not new_params[:west].nil? and not new_params[:east].nil?
      new_params[:lon] = (new_params[:west] + new_params[:east]) / 2
    end
    return new_params
>>>>>>> master
  end

  def atlas_params
    params.require(:atlas).permit \
      :north, :south, :east, :west, :zoom, :rows, :cols, :orientation, :provider, # from select
      :title, :text, :private, # from describe
      :layout, :utm_grid, :paper_size, # from layout
      :refreshed_from, :cloned_from
  end

  def point_extent(point, zoom, dimensions)
    px = Geo::Utils.pixel_coord(point[0], point[1], zoom)
    top_left_px = [
      px[0] - (dimensions[0] / 2),
      px[1] - (dimensions[1] / 2)
    ]
    bottom_right_px = [
      px[0] + (dimensions[0] / 2),
      px[1] + (dimensions[1] / 2)
    ]

    west_north = Geo::Utils.ll_coord(top_left_px[0], top_left_px[1], zoom)
    east_south = Geo::Utils.ll_coord(bottom_right_px[0], bottom_right_px[1], zoom)

    return [
      west_north[0],
      east_south[1],
      east_south[0],
      west_north[1]
    ]

  end

  def polygon_extent(coords)
    coords = coords[0]

    longitude_minmax = coords.minmax_by { |c| c[0]}
    latitude_minmax = coords.minmax_by { |c| c[1]}

    west = longitude_minmax[0][0]
    south = latitude_minmax[0][1]
    east = longitude_minmax[1][0]
    north = latitude_minmax[1][1]

    return [west, south, east, north]

  end

  def initial_center
    if FieldPapers::DEFAULT_CENTER
      return FieldPapers::DEFAULT_LATITUDE,
             FieldPapers::DEFAULT_LONGITUDE,
             FieldPapers::DEFAULT_ZOOM
    else
      if @@cities.nil?
        @@cities = CSV.read("config/capitals.dat")
      end
      lat, lon = @@cities.sample
      return lat, lon, 8
    end
  end
end
