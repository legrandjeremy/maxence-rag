export interface Feature {
    geometry: {
        coordinates: [number, number]
    },
    properties: {
    full_address: string
    name: string
    context : {
        country :{
            id : string
            name :string
            country_code : string
        },
        place : {
            name : string
            id : string
        }
    }
    }

}

export interface DataFromMapbox {
    coords: [number, number],
    feature: Feature
}
