import arrayShuffle from 'array-shuffle';
import _stations from './assets/stations.json';

export class Station {
    constructor(
        name : string,
        disambiguation : string | null,
        localAuthority : string,
        lines : string[],
        zones : number[],
        modes : Mode[],
        riverBanks : RiverBank[],
    ) {
        this.name = name;
        this.disambiguation = disambiguation;
        this.localAuthority = localAuthority;
        this.lines = lines;
        this.zones = zones;
        this.modes = modes;
        this.riverBanks = riverBanks;
    }

    static fromJson(json : typeof _stations[0]) {
        return new Station(
            json.name,
            json.disambiguation,
            json.localAuthority,
            json.lines,
            json.zones,
            json.modes as Mode[],
            json.riverBanks as RiverBank[]
        );
    }

    /**
     * The station name
     *
     * @example
     * 'Euston'
     */
    readonly name : string;
    /**
     * A disambiguation to uniquely identify the station if there are multiple
     * stations of the same name.
     *
     * @example
     * 'Underground'
     */
    readonly disambiguation : string | null;
    /**
     * The local authority the station is in.
     *
     * Currently only supports one even if the station is on a boundary.
     *
     * @example
     * 'Camden'
     */
    readonly localAuthority : string;
    /**
     * The lines which the station serves.
     *
     * @example
     * ['Northern', 'Victoria']
     */
    readonly lines : string[];
    /**
     * The fare zones which the station is in. At most two zones.
     *
     * The constant {@linkcode CPAY} is used for contactless-only stations.
     *
     * The constant {@linkcode SFA} is used for Stratford International (NR).
     * 
     * @example
     * [1]
     */
    readonly zones : number[];
    /**
     * The transport modes which the station serves.
     *
     * @example
     * [Mode.LU]
     */
    readonly modes : Mode[];
    /**
     * The side of the Thames the station is located.
     *
     * Blackfriars (NR) is on both sides of the river.
     *
     * @example
     * [RiverBank.NORTH]
     */
    readonly riverBanks : RiverBank[];

    toString() {
        return `${this.name}${this.disambiguation === null ? '' : ` (${this.disambiguation})`}`;
    }
}

export enum RiverBank {
    NORTH = 'North',
    SOUTH = 'South',
}

export enum Mode {
    LU = 'Underground',
    DLR = 'DLR',
    NR = 'National Rail',
}

/**
 * All stations in the whole contactless area
 */
export const stations : Station[] = _stations.map(Station.fromJson);

/**
 * All TfL lines in the order to be displayed
 */
export const tflLines = [
    "Bakerloo",
    "Central",
    "Circle",
    "District",
    "Hammersmith & City",
    "Jubilee",
    "Metropolitan",
    "Northern",
    "Piccadilly",
    "Victoria",
    "Waterloo & City",
    "DLR",
    "Overground",
    "Elizabeth line",
    "Tram"
];

function getSortIndex(line : string) {
    const tflIndex = tflLines.indexOf(line);
    return tflIndex !== -1 ? tflIndex : tflLines.length;
}

/**
 * All lines in the order to be displayed
 */
export const lines = [...new Set<string>(stations.flatMap(station => station.lines))]
    .sort((a, b) => {
        const a_index = getSortIndex(a);
        const b_index = getSortIndex(b);
        if (a_index === b_index) {
            return a === b ? 0 : a.localeCompare(b, 'en-GB');
        }
        return a_index - b_index;
    });

/**
 * A pseudo-zone representing contactless-only stations
 */
export const CPAY = 16;

/**
 * A pseudo-zone with Stratford International (NR) only
 */
export const SFA = 0;

/**
 * Get all stations within the specified {@link zones}, {@link modes} 
 * and [sides of the Thames]{@link riverBanks} on specified {@link lines}.
 */
export function getBasket(
    zones? : number[],
    modes? : Mode[],
    riverBanks? : RiverBank[],
    lines? : string[]
) {
    return stations.filter(
        station =>
            match(zones, station.zones)
            && match(modes, station.modes)
            && match(riverBanks, station.riverBanks)
            && match(lines, station.lines)
    );
}

/**
 * Get stations from the {@link basket} which are not specified in {@link exclude}.
 */
export function exclude(basket : Station[], exclude : Station[]) {
    return basket.filter(
        station => !exclude.some(selectedStation => selectedStation.toString() === station.toString())
    );
}

/**
 * Get the station in {@link stations} with the specified [string representation]{@link id}.
 */
export function fromString(id : string) {
    return stations.find(station => station.toString() === id) ?? null;
}

/**
 * Get a random set of {@link count} stations from the {@link basket}, optionally
 * starting at [a specified station]{@link startingStation}.
 */
export function generate(
    count: number
    , basket: Station[]
    , startingStation?: Station
) {
    if (basket.length < count) {
        throw new RangeError('There are not enough stations to be drawn.');
    }

    const results = startingStation === undefined
        ? arrayShuffle(basket) : [
            startingStation,
            ...arrayShuffle(basket.filter(station => station.toString() !== startingStation.toString()))
        ];
    if (results.length !== basket.length) {
        throw new RangeError('The starting station cannot be found in the basket.');
    }

    return results.slice(0, count);
}

function match<T>(input: T[] | undefined, data: T[]) {
    return input === undefined || input.some(element => data.includes(element));
}

