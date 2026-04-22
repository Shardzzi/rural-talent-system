<template>
  <el-dialog
    :model-value="visible"
    @close="handleClose"
    :title="isEdit ? '编辑个人信息' : '添加个人信息'"
    :width="isMobile ? '100%' : '720px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    :append-to-body="true"
    :top="isMobile ? '0' : '5vh'"
    :show-close="!isMobile"
    class="person-form-wizard"
    :class="{ 'wizard-mobile': isMobile }"
  >
    <template v-if="isMobile" #header>
      <div class="mobile-header">
        <div class="mobile-step-info">
          <span class="step-current">{{ currentStep + 1 }}</span>
          <span class="step-sep">/</span>
          <span class="step-total">4</span>
          <span class="step-title">{{ stepTitles[currentStep] }}</span>
        </div>
        <el-button class="mobile-close-btn" :icon="Close" circle size="small" @click="handleClose" />
      </div>
      <el-steps :active="currentStep" finish-status="success" simple class="wizard-steps wizard-steps--mobile">
        <el-step v-for="(title, i) in stepTitles" :key="i" :title="title" />
      </el-steps>
    </template>

    <el-steps v-if="!isMobile" :active="currentStep" finish-status="success" align-center class="wizard-steps">
      <el-step title="基本信息" />
      <el-step title="农村特色" />
      <el-step title="技能专长" />
      <el-step title="合作意向" />
    </el-steps>

    <div class="step-content">
      <FormStepBasic
        v-if="currentStep === 0"
        ref="stepBasicRef"
        v-model="formData.basic"
      />
      <FormStepRural
        v-if="currentStep === 1"
        ref="stepRuralRef"
        v-model="formData.rural"
      />
      <FormStepSkills
        v-if="currentStep === 2"
        ref="stepSkillsRef"
        v-model="formData.skills"
      />
      <FormStepCooperation
        v-if="currentStep === 3"
        ref="stepCooperationRef"
        v-model="formData.cooperation"
        :all-form-data="flatFormData"
      />
    </div>

    <template #footer>
      <div class="wizard-footer" :class="{ 'wizard-footer--mobile': isMobile }">
        <el-button v-if="currentStep > 0" @click="prevStep" :size="isMobile ? 'large' : 'default'">
          {{ isMobile ? '上一步' : '上一步' }}
        </el-button>
        <div class="footer-spacer" />
        <el-button type="info" @click="handleSaveDraft" :size="isMobile ? 'large' : 'default'">
          <el-icon><FolderOpened /></el-icon> 暂存
        </el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="nextStep" :size="isMobile ? 'large' : 'default'">
          下一步
        </el-button>
        <el-button v-else type="success" @click="handleSubmit" :loading="submitting" :size="isMobile ? 'large' : 'default'">
          {{ isEdit ? '更新' : '提交' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { ref, reactive, watch, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, Close } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { useAutoSave } from '../../composables/useAutoSave'
import axios from 'axios'
import FormStepBasic from './FormStepBasic.vue'
import FormStepRural from './FormStepRural.vue'
import FormStepSkills from './FormStepSkills.vue'
import FormStepCooperation from './FormStepCooperation.vue'
import type { SkillItem } from './FormStepSkills.vue'

interface BasicData {
  name: string
  age: number | null
  gender: string
  education_level: string
  phone: string
  email: string
  id_card: string
  address: string
  employment_status: string
  political_status: string
  experience: string
}

interface RuralData {
  farming_years: number | null
  planting_scale: number | null
  main_crops: string[]
  breeding_types: string[]
  cooperation_willingness: string[]
  development_direction: string[]
  available_time: string[]
}

interface CooperationData {
  cooperation_type: string
  preferred_scale: string
  investment_capacity: number | null
  time_availability: string
  contact_preference: string
}

function createEmptyBasic(): BasicData {
  return { name: '', age: null, gender: '', education_level: '', phone: '', email: '', id_card: '', address: '', employment_status: '', political_status: '', experience: '' }
}

function createEmptyRural(): RuralData {
  return { farming_years: null, planting_scale: null, main_crops: [], breeding_types: [], cooperation_willingness: [], development_direction: [], available_time: [] }
}

function createEmptyCooperation(): CooperationData {
  return { cooperation_type: '', preferred_scale: '', investment_capacity: null, time_availability: '', contact_preference: '' }
}

function createEmptySkills(): SkillItem[] {
  return [{ category: '', name: '', proficiency: null, experience_years: null }]
}

export default {
  name: 'PersonFormWizard',
  components: { FormStepBasic, FormStepRural, FormStepSkills, FormStepCooperation, FolderOpened },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    person: {
      type: Object,
      default: null
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    isUserMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'saved'],
  setup(props: { visible: boolean; person: Record<string, unknown> | null; isEdit: boolean; isUserMode: boolean }, { emit }: { emit: (event: string, ...args: unknown[]) => void }) {
    const authStore = useAuthStore()
    const currentStep = ref(0)
    const submitting = ref(false)

    const stepTitles = ['基本信息', '农村特色', '技能专长', '合作意向']

    const isMobile = ref(false)
    let mobileQuery: MediaQueryList | null = null

    function handleMobileChange(e: MediaQueryListEvent | MediaQueryList): void {
      isMobile.value = e.matches
    }

    onMounted(() => {
      mobileQuery = window.matchMedia('(max-width: 767px)')
      isMobile.value = mobileQuery.matches
      mobileQuery.addEventListener('change', handleMobileChange)
    })

    onUnmounted(() => {
      if (mobileQuery) {
        mobileQuery.removeEventListener('change', handleMobileChange)
      }
    })

    const stepBasicRef = ref<{ validate: () => Promise<boolean> } | null>(null)
    const stepRuralRef = ref<{ validate: () => Promise<boolean> } | null>(null)
    const stepSkillsRef = ref<{ validate: () => Promise<boolean> } | null>(null)
    const stepCooperationRef = ref<{ validate: () => Promise<boolean> } | null>(null)

    const formData = reactive({
      basic: createEmptyBasic(),
      rural: createEmptyRural(),
      skills: createEmptySkills(),
      cooperation: createEmptyCooperation()
    })

    const draftKey = computed(() => props.isEdit && props.person ? `edit-${(props.person as Record<string, unknown>).id}` : 'new')
    const { hasDraft, loadDraft, clearDraft, startAutoSave, stopAutoSave } = useAutoSave(draftKey.value, ref(formData))

    const flatFormData = computed(() => ({
      ...formData.basic,
      ...formData.rural,
      skills: formData.skills,
      ...formData.cooperation
    }))

    function parseJSONField(field: unknown): string[] {
      try {
        return field ? (typeof field === 'string' ? JSON.parse(field) : field) as string[] : []
      } catch {
        return []
      }
    }

    function parseSkillsFromPerson(person: Record<string, unknown>): SkillItem[] {
      try {
        let skills: Array<Record<string, unknown>> | null = null
        if (person.skills && Array.isArray(person.skills)) {
          skills = person.skills as Array<Record<string, unknown>>
        } else if (person.skills && typeof person.skills === 'string') {
          skills = JSON.parse(person.skills as string)
        }
        if (Array.isArray(skills) && skills.length > 0) {
          return skills.map((skill) => ({
            category: (skill.skill_category || skill.category || '') as string,
            name: (skill.skill_name || skill.name || '') as string,
            proficiency: (skill.proficiency_level || skill.proficiency || null) as number | null,
            experience_years: (skill.experience_years || null) as number | null
          }))
        }
      } catch {
        // fall through
      }
      return createEmptySkills()
    }

    function loadPersonData(person: Record<string, unknown>) {
      const ruralProfile = (person.ruralProfile || person) as Record<string, unknown>
      const cooperation = (person.cooperation || person) as Record<string, unknown>

      formData.basic = {
        name: (person.name || '') as string,
        age: (person.age || null) as number | null,
        gender: (person.gender || '') as string,
        education_level: (person.education_level || '') as string,
        phone: (person.phone || '') as string,
        email: (person.email || '') as string,
        id_card: (person.id_card || person.id_number || '') as string,
        address: (person.address || '') as string,
        employment_status: (person.employment_status || '') as string,
        political_status: (person.political_status || '') as string,
        experience: (person.experience || '') as string
      }

      const mainCrops = parseJSONField(person.ruralProfile ? (person.ruralProfile as Record<string, unknown>).main_crops : person.main_crops)
      const breedingTypes = parseJSONField(person.ruralProfile ? (person.ruralProfile as Record<string, unknown>).breeding_types : person.breeding_types)
      const cooperationWillingness = parseJSONField(person.ruralProfile ? (person.ruralProfile as Record<string, unknown>).cooperation_willingness : person.cooperation_willingness)
      const developmentDirection = parseJSONField(person.ruralProfile ? (person.ruralProfile as Record<string, unknown>).development_direction : person.development_direction)
      const availableTime = parseJSONField(person.ruralProfile ? (person.ruralProfile as Record<string, unknown>).available_time : person.available_time)

      formData.rural = {
        farming_years: (ruralProfile.farming_years || null) as number | null,
        planting_scale: (ruralProfile.planting_scale || null) as number | null,
        main_crops: mainCrops,
        breeding_types: breedingTypes,
        cooperation_willingness: cooperationWillingness,
        development_direction: developmentDirection,
        available_time: availableTime
      }

      formData.skills = parseSkillsFromPerson(person)
      formData.cooperation = {
        cooperation_type: (cooperation.cooperation_type || '') as string,
        preferred_scale: (cooperation.preferred_scale || '') as string,
        investment_capacity: (cooperation.investment_capacity || null) as number | null,
        time_availability: (cooperation.time_availability || '') as string,
        contact_preference: (cooperation.contact_preference || '') as string
      }
    }

    function resetForm() {
      formData.basic = createEmptyBasic()
      formData.rural = createEmptyRural()
      formData.skills = createEmptySkills()
      formData.cooperation = createEmptyCooperation()
      currentStep.value = 0
    }

    function isEmptySkillRow(skill: SkillItem): boolean {
      return !skill.category && !skill.name && skill.proficiency === null && skill.experience_years === null
    }

    watch(() => props.visible, async (newVal) => {
      if (newVal) {
        if (props.isEdit && props.person) {
          loadPersonData(props.person)
          clearDraft()
        } else if (hasDraft.value) {
          try {
            await ElMessageBox.confirm('检测到未完成的草稿，是否恢复？', '草稿恢复', {
              confirmButtonText: '恢复草稿',
              cancelButtonText: '重新填写',
              type: 'info'
            })
            const draft = loadDraft()
            if (draft && typeof draft === 'object') {
              const d = draft as { basic?: BasicData; rural?: RuralData; skills?: SkillItem[]; cooperation?: CooperationData; _step?: number }
              if (d.basic) formData.basic = d.basic
              if (d.rural) formData.rural = d.rural
              if (d.skills) formData.skills = d.skills
              if (d.cooperation) formData.cooperation = d.cooperation
              if (typeof d._step === 'number') currentStep.value = d._step
            }
          } catch {
            resetForm()
            clearDraft()
          }
        } else {
          resetForm()
        }
        startAutoSave()
      } else {
        stopAutoSave()
      }
    })

    onUnmounted(() => {
      stopAutoSave()
    })

    function prevStep() {
      if (currentStep.value > 0) currentStep.value--
    }

    async function nextStep() {
      let valid = false
      if (currentStep.value === 0 && stepBasicRef.value) {
        valid = await stepBasicRef.value.validate()
      } else if (currentStep.value === 1 && stepRuralRef.value) {
        valid = await stepRuralRef.value.validate()
      } else if (currentStep.value === 2 && stepSkillsRef.value) {
        valid = await stepSkillsRef.value.validate()
      } else if (currentStep.value === 3 && stepCooperationRef.value) {
        valid = await stepCooperationRef.value.validate()
      }

      if (valid && currentStep.value < 3) {
        currentStep.value++
      }
    }

    function handleSaveDraft() {
      const dataToSave = { ...formData, _step: currentStep.value }
      const payload = { timestamp: Date.now(), data: dataToSave }
      try {
        localStorage.setItem(`person-form-draft-${draftKey.value}`, JSON.stringify(payload))
        ElMessage.success('草稿已暂存')
      } catch {
        ElMessage.warning('草稿保存失败，存储空间不足')
      }
    }

    async function handleClose() {
      try {
        await ElMessageBox.confirm('确定关闭？未提交的数据将保留为草稿。', '确认关闭', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch {
        return
      }
      stopAutoSave()
      emit('update:visible', false)
    }

    async function handleSubmit() {
      const stepRef = stepCooperationRef.value
      if (stepRef) {
        const valid = await stepRef.validate()
        if (!valid) return
      }

      submitting.value = true
      try {
        const emptySkillsCount = formData.skills.filter(isEmptySkillRow).length
        if (emptySkillsCount > 0) {
          ElMessage.warning(`已移除 ${emptySkillsCount} 条未填写的技能记录`)
        }

        const validSkills = formData.skills.filter(s => s.category && s.name && s.proficiency !== null && s.experience_years !== null)

        const personData = { ...formData.basic }
        const ruralProfileData = {
          farming_years: formData.rural.farming_years,
          planting_scale: formData.rural.planting_scale,
          main_crops: JSON.stringify(formData.rural.main_crops),
          breeding_types: JSON.stringify(formData.rural.breeding_types),
          cooperation_willingness: JSON.stringify(formData.rural.cooperation_willingness),
          development_direction: JSON.stringify(formData.rural.development_direction),
          available_time: JSON.stringify(formData.rural.available_time)
        }
        const cooperationData = { ...formData.cooperation }

        if (props.isEdit && props.person) {
          const updateData = {
            person: personData,
            ruralProfile: ruralProfileData,
            cooperation: cooperationData,
            skills: validSkills
          }
          await axios.put(`/api/persons/${(props.person as Record<string, unknown>).id}/comprehensive`, updateData)
          ElMessage.success('信息更新成功')
        } else {
          const createData = {
            person: personData,
            ruralProfile: ruralProfileData,
            cooperation: cooperationData,
            skills: validSkills
          }
          const response = await axios.post('/api/persons/comprehensive', createData)

          if (props.isUserMode && response.data.data?.id) {
            try {
              await authStore.linkPersonToUser(response.data.data.id)
            } catch (error) {
              try {
                await axios.delete(`/api/persons/${response.data.data.id}`)
              } catch {
                // rollback failed silently
              }
              throw new Error('关联用户账号失败，已取消人员创建')
            }
          }
          ElMessage.success('信息添加成功')
        }

        clearDraft()
        stopAutoSave()
        emit('saved')
        emit('update:visible', false)
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string }
        ElMessage.error('保存失败: ' + (err.response?.data?.message || err.message))
      } finally {
        submitting.value = false
      }
    }

    return {
      currentStep,
      formData,
      flatFormData,
      submitting,
      stepBasicRef,
      stepRuralRef,
      stepSkillsRef,
      stepCooperationRef,
      stepTitles,
      isMobile,
      Close,
      prevStep,
      nextStep,
      handleSaveDraft,
      handleClose,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.person-form-wizard :deep(.el-dialog__body) {
  max-height: calc(90vh - 180px);
  overflow-y: auto;
  padding-bottom: 20px;
}

.wizard-steps {
  margin-bottom: 24px;
}

.step-content {
  min-height: 200px;
}

.wizard-footer {
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.footer-spacer {
  flex: 1;
}

.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.mobile-step-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.step-current {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary, #2E7D32);
}

.step-sep {
  font-size: 16px;
  color: var(--color-text-placeholder, #999);
}

.step-total {
  font-size: 14px;
  color: var(--color-text-placeholder, #999);
}

.step-title {
  font-size: 14px;
  color: var(--color-text-regular, #333);
  margin-left: 8px;
  font-weight: 500;
}

.mobile-close-btn {
  flex-shrink: 0;
}

.wizard-steps--mobile {
  margin-bottom: 16px;
  margin-top: 8px;
}

.wizard-footer--mobile {
  position: sticky;
  bottom: 0;
  background: var(--el-bg-color, #fff);
  padding: 12px 0;
  border-top: 1px solid var(--color-border-light, #e4e7ed);
  z-index: 10;
}

@media (max-width: 767px) {
  .wizard-mobile :deep(.el-dialog) {
    border-radius: 0;
    margin: 0;
  }

  .wizard-mobile :deep(.el-dialog__body) {
    max-height: none;
    overflow-y: auto;
    padding: 16px;
  }

  .wizard-mobile :deep(.el-dialog__footer) {
    padding: 0 16px 16px;
  }

  .wizard-mobile :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    padding-bottom: 4px;
    width: auto !important;
  }

  .wizard-mobile :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }

  .wizard-mobile :deep(.el-col-12) {
    max-width: 100%;
    flex: 0 0 100%;
  }

  .wizard-mobile :deep(.el-row) {
    margin-left: 0;
    margin-right: 0;
  }

  .wizard-mobile :deep(.el-row > [class*="el-col"]) {
    padding-left: 0;
    padding-right: 0;
  }

  .wizard-mobile :deep(.el-input__inner),
  .wizard-mobile :deep(.el-textarea__inner),
  .wizard-mobile :deep(.el-select .el-input__inner) {
    min-height: 44px;
    font-size: 16px;
  }

  .wizard-mobile :deep(.el-input-number) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .wizard-mobile :deep(.el-button) {
    min-height: 44px;
    padding: 8px 20px;
  }
}
</style>
