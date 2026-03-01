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
                <el-button type="success" icon="AddLocation" @click="handleCreateMonitor">
                    监测点
                </el-button>
                <el-button type="success" icon="EditPen">
                    <el-dropdown @command="handleToolGeometry" :teleported="false">
                        <span class="dropdown-link">
                            {{ currentGeometry }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item
                                    v-for="item in GEOMETRY_TYPES"
                                    :key="item.value"
                                    :command="item.name"
                                >
                                    {{ item.name }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </el-button>
                <el-button type="success" icon="View" @click="handleMapScreen">
                    大屏
                </el-button>
            </el-button-group>
        </div>
        <el-drawer 
            v-model="drawerVisible"
            :modal="false"
            title="数据面板"
            modal-class="map-edit-drawer"
            size="100%"
        >
            <template #default>
                <el-form 
                    ref="drawerRef"
                    :model="drawerForm"
                    :rules="drawerFormRules"
                    label-position="top"
                    style="width: 100%"
                >
                    <el-form-item label="名称" prop="name">
                        <el-input v-model="drawerForm.name" placeholder="请输入监测点名称" />
                    </el-form-item>
                    <el-form-item label="经度" prop="lng">
                        <el-input v-model.number="drawerForm.lng" disabled>
                        <template #append>°E</template>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="纬度" prop="lat">
                        <el-input v-model.number="drawerForm.lat" disabled>
                        <template #append>°N</template>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="总面积" prop="allArea">
                        <el-input
                            v-model="drawerForm.allArea"
                            type="number"
                            placeholder="请输入总面积"
                            @blur="drawerForm.allArea = Number(drawerForm.allArea)"
                        >
                        <template #append>km²</template>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="监测面积" prop="monitorArea">
                        <el-input
                            v-model="drawerForm.monitorArea"
                            type="number"
                            placeholder="请输入监测面积"
                            @blur="drawerForm.monitorArea = Number(drawerForm.monitorArea)"
                        >
                        <template #append>km²</template>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="城市" prop="city">
                        {{ drawerForm.city }}
                    </el-form-item>
                    <el-form-item label="设备状态" prop="status">
                        <el-switch
                            v-model="drawerForm.status"
                            active-value="on"
                            inactive-value="off"
                            active-text="启动"
                            inactive-text="关闭"
                        />
                    </el-form-item>
                    <el-form-item label="土壤质量" prop="quality">
                        <el-col :span="3">
                            {{ qualityText }}
                        </el-col>
                        <el-col :span="20" :offset="1">
                        <el-slider
                            v-model="drawerForm.quality"
                            :show-tooltip="false"
                            :min="0"
                            :max="4"
                            show-stops
                        />
                        </el-col>
                    </el-form-item>
                    </el-form> 
                
            </template>

            <template #footer>
                <div style="flex: auto">
                <el-button
                    v-if="drawerForm.id === 0"
                    type="primary"
                    @click="drawerFormCreateSubmit(drawerRef)"
                    >添加监测点</el-button
                >
                    <template v-else>
                        <el-button type="primary" @click="drawerFormEidtSubmit(drawerRef)"
                        >更新数据</el-button
                        >
                        <el-popconfirm
                        title="删除监测点？"
                        placement="top-end"
                        :teleported="false"
                        confirm-button-text="是"
                        cancel-button-text="否"
                        @confirm="drawerRemoveMonitor"
                        >
                        <template #reference>
                            <el-button type="danger">删除监测点</el-button>
                        </template>
                        </el-popconfirm>
                    </template>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { Feature, Map, MapBrowserEvent, View } from 'ol';
import { computed, onMounted, ref } from 'vue';

import { GEOMETRY_TYPES, QUALITY_LEVELS, TDT_TOKEN, ZJS_CENTER, ZJS_CITYS, ZJS_EXTENT, ZJS_GeoJSON_URL } from '@config/index';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { Vector, XYZ } from 'ol/source';
import { Tile as TileLayer } from 'ol/layer';
import { defaults as defaultsControls, FullScreen, OverviewMap, ScaleLine, ZoomSlider } from 'ol/control';
import VectorLayer from 'ol/layer/Vector';
import { GeoJSON } from 'ol/format'
import type { FeatureLike } from 'ol/Feature';
import { Circle, Fill, Stroke, Style, Text , Icon } from 'ol/style';
import { Geometry } from 'ol/geom';
import { Draw, Translate } from 'ol/interaction';
import type { Circle as GeomCirle, Point } from 'ol/geom'
import { fromCircle } from 'ol/geom/Polygon';
import { getArea } from 'ol/sphere'
import type { Monitor } from '@/interfaces';
import { type FormRules, type FormInstance, ElMessage } from 'element-plus';
import { createMonitor, getMonitors , updateMonitor , deleteMonitor} from '@/api';
import { monitorGeoJSON } from '@/utils/index';

import jiance_on from '@/assets/jiance_on.png'
import jiance_off from '@/assets/jiance_off.png'


let map: Map
const tdt_vecUrl = 'https://t0.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=' + TDT_TOKEN
const tdt_cvaUrl = 'https://t0.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=' + TDT_TOKEN
const center = fromLonLat(ZJS_CENTER)
const extent = transformExtent(ZJS_EXTENT, 'EPSG:4326', 'EPSG:3857')

const currentCity = ref('城市')
const currentGeometry = ref('绘制')
const isDrawing = ref<boolean>(false)
const drawerVisible = ref<boolean>(false)
const drawerRef = ref<FormInstance>()
const drawerForm = ref<Monitor>({
    id: 0,
    name: '',
    lng: 0,
    lat: 0,
    city: '',
    status: 'on',
    quality: 3,
    monitorArea: 0,
    allArea: 0,
})
const drawerFormRules = ref<FormRules>({
    name: [
    { required: true, message: '请输入监测点名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符之间', trigger: 'blur' },
  ],
  city: [{ required: true, message: '超出范围', trigger: 'change' }],
  monitorArea: [
    { required: true, message: '请输入监测面积', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === 0) {
          callback(new Error('监测面积不能为 0'))
        } else if (value > drawerForm.value.allArea) {
          callback(new Error('监测面积不能大于总面积'))
        } else {
          callback()
        }
      },
      trigger: 'blue',
    },
  ],
  allArea: [
    { required: true, message: '请输入总面积', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === 0) {
          callback(new Error('监测面积不能为 0'))
        } else {
          callback()
        }
      },
      trigger: 'blue',
    },
  ],
})

const qualityText = computed(()=>{
    return QUALITY_LEVELS.find((item) => item.value === drawerForm.value.quality)?.name
})

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

const monitorVectorStyle = (feature: FeatureLike) => {
  const status = feature.get('status') ?? 'on'
  return new Style({
    image: new Icon({
      src: status === 'on' ? jiance_on : jiance_off,
      width: 50,
      height: 50,
    }),
  })
}

const monitorLayer = new VectorLayer({
    source: new Vector<Feature<Geometry>>({
        features: []
    }),
    style: monitorVectorStyle
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

const drawerFormCreateSubmit = async(formEl: FormInstance | undefined) =>{
    if(!formEl) return
    await formEl.validate((valid , fields) => {
        if(valid){
            createMonitor(drawerForm.value).then(() => {
                ElMessage({
                    message: '添加监测点成功',
                    type: 'success',
                    appendTo: '#map-id'
                })
                renderMonitors()
            })
        }else{
            console.log('error', fields);
        }
    })
}

const drawerFormEidtSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      updateMonitor(drawerForm.value).then(() => {
        ElMessage({
          message: '更新数据成功',
          type: 'success',
          appendTo: '#map-edit',
        })
        renderMonitors()
      })
    } else {
      console.log('error submit!', fields)
    }
  })
}

const drawerRemoveMonitor = () => {
  deleteMonitor(drawerForm.value.id).then(() => {
    ElMessage({
      message: '删除监测点成功',
      type: 'success',
      appendTo: '#map-edit',
    })
    renderMonitors()
  })
}

const getCoordinates = (feature: Feature) => {
    const geometry = feature.getGeometry()
    if(geometry && geometry.getType() === 'Point'){
        return (geometry as Point).getCoordinates()
    }
    return [ 0 , 0 ]
}

const getCityName = (feature: Feature) => {
    const getCoordinate = getCoordinates(feature)
    const cityFeatures = cityLayer.getSource()?.getFeatures() || []
    for(const cityFeature of cityFeatures){
        const cityGeom = cityFeature.getGeometry()
        if (cityGeom && cityGeom.intersectsCoordinate(getCoordinate)) {
            return cityFeature.get('name') || ''
        }
    }
    return ''
}

const renderMonitors = () => {
    geometryLayer.getSource()?.clear()
    monitorLayer.getSource()?.clear()
    drawerRef.value?.resetFields()
    drawerVisible.value = false

    const translate = new Translate({
        layers: [monitorLayer],
    })
    map.addInteraction(translate)

    translate.on('translateend',(e) => {
        e.features.forEach((feature) => {
            const {
                name = '',
                status = 'on',
                id = 0,
                quality = 3,
                monitorArea = 0,
                allArea = 0,
            } = feature.getProperties()

            if(!drawerVisible.value || drawerForm.value.id !== id) {
                drawerForm.value.id = id
                drawerForm.value.name = name
                drawerForm.value.status = status
                drawerForm.value.quality = quality
                drawerForm.value.monitorArea = monitorArea
                drawerForm.value.allArea = allArea
                drawerVisible.value = true
            }

            const coord = getCoordinates(feature)
            const lonlat = toLonLat(coord)
            drawerForm.value.lng = Number(lonlat[0]?.toFixed(4) ?? 0)
            drawerForm.value.lat = Number(lonlat[1]?.toFixed(4))
            drawerForm.value.city = currentCity.value = getCityName(feature)
        })
    })

    getMonitors().then((res) => {
    const features = new GeoJSON().readFeatures(monitorGeoJSON(res), {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    })
    // features 添加到地图上
    monitorLayer.getSource()?.addFeatures(features)
  })
}

const handleCreateMonitor = () => {
    drawerVisible.value = false
    
    const drawMonitorInteraction = new Draw({
        source: monitorLayer.getSource() as Vector<Feature<Geometry>>,
        type: 'Point'
    })
    map.addInteraction(drawMonitorInteraction)
    drawMonitorInteraction.on('drawend', (e) =>{
        map.removeInteraction(drawMonitorInteraction)
        
        const coord = getCoordinates(e.feature)
        const lonlat = toLonLat(coord)
        
        drawerForm.value = {
            id: 0,
            name: '',
            lng: Number(lonlat[0]?.toFixed(4) ?? 0),
            lat: Number(lonlat[1]?.toFixed(4) ?? 0),
            city: getCityName(e.feature),
            status: 'on',
            quality: 3,
            monitorArea: 0,
            allArea: 0,
        }
        currentCity.value = drawerForm.value.city
        drawerVisible.value = true
        
        monitorLayer.getSource()?.removeFeature(e.feature)
    })
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

const handleMapScreen = () => {
    window.open('/mapScreen', '_blank')
}

const handleClickFeatrue = ( e: MapBrowserEvent)=>{
    if (isDrawing.value) return

    const geometryFeature = map.forEachFeatureAtPixel(
        e.pixel,
        (feat) => {
        return feat instanceof Feature ? feat : null
        },
        {
        layerFilter: (layer) => layer === geometryLayer,
        },
    )

    if (geometryFeature && currentGeometry.value === '清除') {
        geometryLayer.getSource()?.removeFeature(geometryFeature)
        currentGeometry.value = '绘制'
        return
    }

    const monitorFeature = map.forEachFeatureAtPixel(
        e.pixel,
        (feat) => {
            return feat instanceof Feature ? feat : null
        },
        {
            layerFilter: (layer) => layer === monitorLayer,
        },
    )

    if (monitorFeature) {
        const coord = getCoordinates(monitorFeature)
        map.getView().animate({
            center: coord,
            zoom: 12,
            duration: 500,
        })
        return
    }

    const cityFeatures = cityLayer.getSource()?.getFeatures() || []
    const cityFeature = map.forEachFeatureAtPixel(
        e.pixel,
        (feat) => {
            return feat instanceof Feature ? feat : null
        },
        {
            layerFilter: (layer) => layer === cityLayer,
        },
    )

    if (cityFeature) {
        const props = cityFeature.getProperties()
        activeCityFeature(cityFeatures, cityFeature, props.name)
    }
}

onMounted(()=>{
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(contextId: string, options?: any) {
        if (contextId === '2d') {
            return originalGetContext.call(this, contextId, { 
                ...options, 
                willReadFrequently: true 
            })
        }
        return originalGetContext.call(this, contextId, options)
    } as typeof HTMLCanvasElement.prototype.getContext

    map = new Map({
        target: 'map-id',
        layers: [baseVecLayer , tagCvaLayer , cityLayer , monitorLayer, geometryLayer ],
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

    HTMLCanvasElement.prototype.getContext = originalGetContext

    map.on('singleclick', handleClickFeatrue)
    renderMonitors()
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