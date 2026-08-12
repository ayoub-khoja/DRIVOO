import * as bookcarsTypes from ':bookcars-types'
import agencyAxiosInstance from './agencyAxios'

export const create = (data: bookcarsTypes.CreateCarPayload): Promise<bookcarsTypes.Car> =>
  agencyAxiosInstance
    .post('/api/create-car', data)
    .then((res) => res.data)

export const createImage = (file: Blob): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)
  return agencyAxiosInstance
    .post('/api/create-car-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}

export const deleteTempImage = (image: string): Promise<number> =>
  agencyAxiosInstance
    .post(`/api/delete-temp-car-image/${encodeURIComponent(image)}`)
    .then((res) => res.status)

export const validateLicensePlate = (licensePlate: string): Promise<number> =>
  agencyAxiosInstance
    .get(`/api/validate-license-plate/${encodeURIComponent(licensePlate)}`)
    .then((res) => res.status)

export const getCars = (
  keyword: string,
  data: bookcarsTypes.GetCarsPayload,
  page: number,
  size: number,
): Promise<bookcarsTypes.Result<bookcarsTypes.Car>> =>
  agencyAxiosInstance
    .post(`/api/cars/${page}/${size}/?s=${encodeURIComponent(keyword)}`, data)
    .then((res) => res.data)

export const deleteCar = (id: string): Promise<number> =>
  agencyAxiosInstance
    .delete(`/api/delete-car/${encodeURIComponent(id)}`)
    .then((res) => res.status)
