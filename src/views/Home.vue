<template>
    <div id="map-id">
        <div id="map-tools">
            <el-button-group size="large">
                <el-button type="success" icon="Place">
                    <el-dropdown @command="handleToolCity" :teleported="false">
                        <span class="dropdown-link">
                            {{ currentCity }} <el-icon class="el-icon--right"><arrow-down></arrow-down></el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu class="menu-cities">
                                <el-dropdown-item v-for="item in ZJS_CITYS" :key="item.value" :command="item.name">
                                    {{ item.name }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </el-button>
                <el-button type="success" icon="AddLocation">
                    监测点
                </el-button>
                <el-button type="success" icon="EditPen">
                    <el-dropdown @command="handleToolGeometry" :teleported="false">
                        <span class="dropdown-link">
                            {{ currentGeometry }} <el-icon class="el-icon--right"><arrow-down /></el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdow-menu>
                                <el-dropdown-item v-for="item in GEOMETRY_TYPES" :key="item.value" :command="item.name">
                                    {{ item.name }}
                                </el-dropdown-item>
                            </el-dropdow-menu>
                        </template>
                    </el-dropdown> 
                </el-button>
            </el-button-group>
        </div>


    </div>
</template>

<script setup lang="ts">
import { Feature, Map, View } from 'ol';
import { onMounted, ref } from 'vue';

import { GEOMETRY_TYPES, TDT_TOKEN, ZJS_CENTER, ZJS_CITYS, ZJS_EXTENT, ZJS_GeoJSON_URL } from '@config/index';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Vector, XYZ } from 'ol/source';
import { Tile as TileLayer } from 'ol/layer';
import { defaults as defaultsControls, FullScreen, OverviewMap, ScaleLine, ZoomSlider } from 'ol/control';
import VectorLayer from 'ol/layer/Vector';
import { GeoJSON } from 'ol/format'
import type { FeatureLike } from 'ol/Feature';
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';
import { Geometry } from 'ol/geom';
import { Draw } from 'ol/interaction';
import type { Circle as GeomCirle } from 'ol/geom'
import { fromCircle } from 'ol/geom/Polygon';
import { getArea } from 'ol/sphere'

let map: Map
const tdt_vecUrl = 'https://t0.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=' + TDT_TOKEN
const tdt_cvaUrl = 'https://t0.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=' + TDT_TOKEN
const center = fromLonLat(ZJS_CENTER)
const extent = transformExtent(ZJS_EXTENT, 'EPSG:4326', 'EPSG:3857')

const currentCity = ref('城市')
const currentGeometry = ref('绘制')
const isDrawing = ref<boolean>(false)


//图层
const baseVecLayer = new TileLayer({
    source: new XYZ({
        url: tdt_vecUrl,
    })
})

const tagCvaLayer = new TileLayer({
    source: new XYZ({
        url: tdt_cvaUrl
    })
})

const initCityVectorStyle = new Style({
    stroke: new Stroke({
        color: '#0000ff',
        width: 2,
        lineDash: [10 , 10]
    }),
    fill: new Fill({
        color: 'rgba(255,255, 0, 0.3)'
    })
})

const cityLayer = new VectorLayer({
    source: new Vector({
        url: ZJS_GeoJSON_URL,
        format: new GeoJSON({
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        })
    }),
    style: initCityVectorStyle
})

const geometryStyle = (feature:FeatureLike) => {
    return new Style({
        image: new Circle({
            radius: 10,
            fill: new Fill({
                color: '#ffff0080'
            }),
            stroke: new Stroke({
                color: '#ff0000',
                width: 2
            })
        }),
        fill: new Fill({
            color: '#ffff0080'
        }),
        stroke: new Stroke({
            color: '#ff0000',
            width: 2
        }),
        text: new Text({
            font: '14px sans-serif',
            fill: new Fill({
                color: '#0000ff'
            }),
            text: feature.get('area')
        })
    })
}

const geometryLayer = new VectorLayer({
    source: new Vector<Feature<Geometry>>({
        features: []
    }),
    style: geometryStyle
})

const overviewVectorStyle = (feature: FeatureLike) => {
    return new Style({
        stroke: new Stroke({
            color: '#FF0000',
            width: 1,
        }),
        text: new Text({
            font: '12px sans-serif',
            fill: new Fill({
                color: '#005500'
            }),
            text: feature.get('name')
        })
    })
}

const overviewLayer = new VectorLayer({
    source: new Vector({
        url: ZJS_GeoJSON_URL,
        format: new GeoJSON({
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        })
    }),
    style: overviewVectorStyle
})

const activeCityVectorStyle = new Style({
  stroke: new Stroke({
    color: '#0000FF',
    width: 2,
    lineDash: [10, 10],
  }),
  fill: new Fill({
    color: 'rgba(255, 255, 0, 0.3)',
  }),
})

const activeCityFeature = ( features: Feature[] , feature: Feature , city: string ) => {
    currentCity.value = city
    features.forEach( item => {
        item.setStyle(initCityVectorStyle)
    });
    feature.setStyle(activeCityVectorStyle)
    const geometry = feature.getGeometry()
    if(geometry){
        map.getView().fit(geometry.getExtent(),{ duration: 500 })
    }
}

const handleToolCity = (command: string) =>{
    currentCity.value = command
    const cityFeatures = cityLayer.getSource()?.getFeatures() || []
    const cityFeature = cityFeatures.find((item)=> item.get('name') === command)
    if(cityFeature){
        activeCityFeature(cityFeatures , cityFeature , command)
    }
}

const handleToolGeometry = (command: string) => {
    currentGeometry.value = command
    const type = GEOMETRY_TYPES.find( item => item.name === command )?.value
    if(type === 'Polygon' || type === 'Circle'){
        isDrawing.value = true
        const drawGeometryInteraction = new Draw({
            source: geometryLayer.getSource() as Vector<Feature<Geometry>>,
            type
        })
        map.addInteraction(drawGeometryInteraction)
        drawGeometryInteraction.on('drawend',(e)=>{
            const geometry = e.feature.getGeometry()
            let area = 0
            if(geometry && geometry.getType() === 'Circle') {
                const polygon = fromCircle(geometry as GeomCirle , 64)
                area = getArea(polygon)
            }else if(geometry && geometry.getType() === 'Polygon'){
                area = getArea(geometry)
            }
            e.feature.set('area', ( area / 1000000).toFixed(2) + 'km²')
            map.removeInteraction(drawGeometryInteraction)
            currentGeometry.value = '绘制'
            setTimeout(()=>{
                isDrawing.value = false
            }, 500)
        })
    }
}


onMounted(()=>{
    map = new Map({
        target: 'map-id',
        layers: [baseVecLayer , tagCvaLayer , cityLayer , geometryLayer ],
        view: new View({
            center,
            extent,
            zoom: 2,
        }),
        controls: defaultsControls().extend([
            new ScaleLine(),
            new ZoomSlider(),
            new FullScreen(),
            new OverviewMap({
                layers: [overviewLayer],
                collapsed: false,
                view: new View({
                    extent
                })
            })
        ])
    })
})
</script>

<style scoped>
#map-id {
  position: absolute;
  inset: 0;
  z-index: 0;
}
#map-tools {
  position: absolute;
  left: 50%;
  top: 10px;
  transform: translateX(-50%);
  z-index: 10;
}
.dropdown-link {
  color: white;
  outline: none;
}
.menu-cities {
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, 1fr));
}
::v-deep(.ol-overviewmap) {
  left: auto;
  right: 0.5em;
  .ol-overviewmap-map {
    width: 300px;
    height: 300px;
  }
}
</style>