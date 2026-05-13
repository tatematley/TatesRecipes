import { useState } from 'react'
import { FilterState } from '../types'

const defaultFilters: FilterState = {
  search: '',
  category: '',
  timeFilter: '',
  dietaryTags: [],
  occasionTags: [],
  difficulty: '',
  favoritesOnly: false,
  createdByTateOnly: false,
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  function setSearch(search: string) {
    setFilters((f) => ({ ...f, search }))
  }

  function setCategory(category: string) {
    setFilters((f) => ({ ...f, category }))
  }

  function setTimeFilter(timeFilter: string) {
    setFilters((f) => ({ ...f, timeFilter }))
  }

  function toggleDietaryTag(tag: string) {
    setFilters((f) => ({
      ...f,
      dietaryTags: f.dietaryTags.includes(tag)
        ? f.dietaryTags.filter((t) => t !== tag)
        : [...f.dietaryTags, tag],
    }))
  }

  function toggleOccasionTag(tag: string) {
    setFilters((f) => ({
      ...f,
      occasionTags: f.occasionTags.includes(tag)
        ? f.occasionTags.filter((t) => t !== tag)
        : [...f.occasionTags, tag],
    }))
  }

  function setDifficulty(difficulty: string) {
    setFilters((f) => ({ ...f, difficulty }))
  }

  function setFavoritesOnly(favoritesOnly: boolean) {
    setFilters((f) => ({ ...f, favoritesOnly }))
  }

  function setCreatedByTateOnly(createdByTateOnly: boolean) {
    setFilters((f) => ({ ...f, createdByTateOnly }))
  }

  function clearFilters() {
    setFilters(defaultFilters)
  }

  const activeCount =
    (filters.search ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.timeFilter ? 1 : 0) +
    filters.dietaryTags.length +
    filters.occasionTags.length +
    (filters.difficulty ? 1 : 0) +
    (filters.favoritesOnly ? 1 : 0) +
    (filters.createdByTateOnly ? 1 : 0)

  return {
    filters,
    activeCount,
    setSearch,
    setCategory,
    setTimeFilter,
    toggleDietaryTag,
    toggleOccasionTag,
    setDifficulty,
    setFavoritesOnly,
    setCreatedByTateOnly,
    clearFilters,
  }
}
