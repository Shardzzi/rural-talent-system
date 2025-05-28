import axios from 'axios'

// 人员信息管理 API 服务
class PersonService {
  // 获取所有人员
  async getPersons() {
    console.log('🔄 API调用: getPersons()')
    try {
      const response = await axios.get('/api/persons')
      console.log('✅ getPersons 响应:', response.data)
      // 后端返回 {success: true, data: [...]}，我们需要返回 data 数组
      return response.data.data || response.data
    } catch (error) {
      console.error('❌ getPersons 失败:', error)
      throw error
    }
  }

  // 创建新人员
  async createPerson(personData) {
    console.log('🔄 API调用: createPerson()', personData)
    try {
      const response = await axios.post('/api/persons', personData)
      console.log('✅ createPerson 响应:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ createPerson 失败:', error)
      throw error
    }
  }

  // 更新人员信息
  async updatePerson(id, personData) {
    console.log('🔄 API调用: updatePerson()', { id, personData })
    try {
      const response = await axios.put(`/api/persons/${id}`, personData)
      console.log('✅ updatePerson 响应:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ updatePerson 失败:', error)
      throw error
    }
  }

  // 删除人员
  async deletePerson(id) {
    console.log('🔄 API调用: deletePerson()', { id })
    try {
      const response = await axios.delete(`/api/persons/${id}`)
      console.log('✅ deletePerson 响应:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ deletePerson 失败:', error)
      throw error
    }
  }

  // 获取数据统计
  async getStatistics() {
    console.log('🔄 API调用: getStatistics()')
    try {
      const response = await axios.get('/api/statistics')
      console.log('✅ getStatistics 响应:', response.data)
      // 后端返回 {success: true, data: {...}} 或直接返回数据
      return response.data.data || response.data
    } catch (error) {
      console.error('❌ getStatistics 失败:', error)
      throw error
    }
  }

  // 获取技能库统计
  async getSkillsLibraryStats() {
    console.log('🔄 API调用: getSkillsLibraryStats()')
    try {
      const response = await axios.get('/api/skills-library-stats')
      console.log('✅ getSkillsLibraryStats 响应:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ getSkillsLibraryStats 失败:', error)
      throw error
    }
  }

  // 获取人员详细信息
  async getPersonDetails(id) {
    console.log('🔄 API调用: getPersonDetails()', { id })
    try {
      const response = await axios.get(`/api/persons/${id}/details`)
      console.log('✅ getPersonDetails 响应:', response.data)
      // 直接返回完整响应，让调用者处理数据结构
      return response.data
    } catch (error) {
      console.error('❌ getPersonDetails 失败:', error)
      throw error
    }
  }

  // 搜索人才
  async searchTalents(searchCriteria) {
    const response = await axios.get('/api/search', { params: searchCriteria })
    return response.data
  }
}

export default new PersonService()
