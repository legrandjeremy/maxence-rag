export interface ResponseDto<T> {
    count: number;
    items?: T[];
}

export interface ServiceResponseDto<T> {
    readonly status: number;
    readonly count?: number | undefined;
    readonly data?: T | T[] | null | undefined | string;
    readonly statusText: string;
    readonly ok: boolean;
    readonly error?: string;
}

export async function toServiceResponseDto<T>(response: Response): Promise<ServiceResponseDto<T>> {
    const responseResult = await response.json();
    const { count, data: items } = responseResult;
    console.log("ResponseDto", responseResult);
    return {
        status: response.status,
        count,
        data: items,
        error: responseResult.error,
        statusText: response.statusText,
        ok: response.ok
    };
}