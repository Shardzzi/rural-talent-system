<template>
  <el-form
    ref="formRef"
    :model="modelValue"
    :rules="rules"
    label-width="120px"
    size="default"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="从事农业年限" prop="farming_years">
          <el-input-number
            :model-value="modelValue.farming_years"
            @update:model-value="update('farming_years', $event)"
            :min="0"
            :max="100"
            style="width: 100%; max-width: 280px;"
            placeholder="请输入从业年限"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="种植规模(亩)" prop="planting_scale">
          <el-input-number
            :model-value="modelValue.planting_scale"
            @update:model-value="update('planting_scale', $event)"
            :min="0"
            :precision="1"
            style="width: 100%; max-width: 280px;"
            placeholder="请输入种植规模"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="主要作物" prop="main_crops">
      <el-select
        :model-value="modelValue.main_crops"
        @update:model-value="update('main_crops', $event)"
        multiple
        placeholder="请选择主要作物"
        style="width: 100%"
        :teleported="true"
      >
        <el-option label="小麦" value="小麦" />
        <el-option label="玉米" value="玉米" />
        <el-option label="大豆" value="大豆" />
        <el-option label="水稻" value="水稻" />
        <el-option label="苹果" value="苹果" />
        <el-option label="大樱桃" value="大樱桃" />
        <el-option label="蔬菜大棚" value="蔬菜大棚" />
        <el-option label="花生" value="花生" />
        <el-option label="棉花" value="棉花" />
        <el-option label="葡萄" value="葡萄" />
        <el-option label="其他" value="其他" />
      </el-select>
    </el-form-item>

    <el-form-item label="养殖类型" prop="breeding_types">
      <el-select
        :model-value="modelValue.breeding_types"
        @update:model-value="update('breeding_types', $event)"
        multiple
        placeholder="请选择养殖类型"
        style="width: 100%"
        :teleported="true"
      >
        <el-option label="生猪" value="生猪" />
        <el-option label="土鸡" value="土鸡" />
        <el-option label="奶牛" value="奶牛" />
        <el-option label="山羊" value="山羊" />
        <el-option label="肉牛" value="肉牛" />
        <el-option label="鸭子" value="鸭子" />
        <el-option label="鹅" value="鹅" />
        <el-option label="兔子" value="兔子" />
        <el-option label="水产养殖" value="水产养殖" />
        <el-option label="蜜蜂" value="蜜蜂" />
      </el-select>
    </el-form-item>

    <el-form-item label="合作意愿" prop="cooperation_willingness">
      <el-select
        :model-value="modelValue.cooperation_willingness"
        @update:model-value="update('cooperation_willingness', $event)"
        multiple
        placeholder="请选择合作意愿"
        style="width: 100%"
        :teleported="true"
      >
        <el-option label="合作社" value="合作社" />
        <el-option label="技术服务" value="技术服务" />
        <el-option label="技术合作" value="技术合作" />
        <el-option label="销售合作" value="销售合作" />
        <el-option label="电商合作" value="电商合作" />
        <el-option label="品牌推广" value="品牌推广" />
        <el-option label="技术培训" value="技术培训" />
        <el-option label="项目合作" value="项目合作" />
        <el-option label="资金合作" value="资金合作" />
      </el-select>
    </el-form-item>

    <el-form-item label="发展方向" prop="development_direction">
      <el-select
        :model-value="modelValue.development_direction"
        @update:model-value="update('development_direction', $event)"
        multiple
        placeholder="请选择发展方向"
        style="width: 100%"
        :teleported="true"
      >
        <el-option label="果品深加工" value="果品深加工" />
        <el-option label="农产品电商" value="农产品电商" />
        <el-option label="现代农业技术" value="现代农业技术" />
        <el-option label="有机农业" value="有机农业" />
        <el-option label="农业观光" value="农业观光" />
        <el-option label="农业机械化" value="农业机械化" />
        <el-option label="种子培育" value="种子培育" />
        <el-option label="农产品加工" value="农产品加工" />
      </el-select>
    </el-form-item>

    <el-form-item label="可用时间" prop="available_time">
      <el-select
        :model-value="modelValue.available_time"
        @update:model-value="update('available_time', $event)"
        multiple
        placeholder="请选择可用时间"
        style="width: 100%"
        :teleported="true"
      >
        <el-option label="春季" value="春季" />
        <el-option label="夏季" value="夏季" />
        <el-option label="秋季" value="秋季" />
        <el-option label="冬季" value="冬季" />
        <el-option label="全年" value="全年" />
        <el-option label="农闲时" value="农闲时" />
        <el-option label="周末" value="周末" />
        <el-option label="节假日" value="节假日" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'

export interface RuralFormData {
  farming_years: number | null
  planting_scale: number | null
  main_crops: string[]
  breeding_types: string[]
  cooperation_willingness: string[]
  development_direction: string[]
  available_time: string[]
}

export default {
  name: 'FormStepRural',
  props: {
    modelValue: {
      type: Object as () => RuralFormData,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props: { modelValue: RuralFormData }, { emit }: { emit: (event: 'update:modelValue', value: RuralFormData) => void }) {
    const formRef = ref<FormInstance | null>(null)

    const rules = {
      farming_years: [
        { type: 'number' as const, min: 0, max: 100, message: '从事农业年限应在0-100年之间', trigger: ['blur', 'change'] }
      ],
      planting_scale: [
        { type: 'number' as const, min: 0, message: '种植规模必须为正数', trigger: ['blur', 'change'] }
      ],
      main_crops: [
        {
          validator: (_rule: unknown, value: string[] | null, callback: (error?: Error) => void) => {
            const form = props.modelValue
            const hasRuralInfo = form.farming_years !== null ||
              form.planting_scale !== null ||
              (form.breeding_types && form.breeding_types.length > 0) ||
              (form.cooperation_willingness && form.cooperation_willingness.length > 0) ||
              (form.development_direction && form.development_direction.length > 0) ||
              (form.available_time && form.available_time.length > 0)
            if (hasRuralInfo && (!value || value.length === 0)) {
              callback(new Error('填写了农村特色信息时，主要作物不能为空'))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ]
    }

    function update(field: keyof RuralFormData, value: unknown) {
      emit('update:modelValue', { ...props.modelValue, [field]: value })
    }

    async function validate(): Promise<boolean> {
      if (!formRef.value) return false
      try {
        await formRef.value.validate()
        return true
      } catch {
        return false
      }
    }

    return { formRef, rules, update, validate }
  }
}
</script>
