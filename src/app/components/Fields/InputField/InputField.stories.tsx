import { Meta, StoryObj } from '@storybook/react'
import { FormProvider, useForm } from 'react-hook-form'
import { ReactNode } from 'react'
import { InputField } from '..'

const StoryFormProvider = ({ children }: { children: ReactNode }) => {
  const methods = useForm()

  return <FormProvider {...methods}>{children}</FormProvider>
}

const meta = {
  title: 'fields/InputField',
  component: InputField,
  decorators: [
    (Story) => (
      <StoryFormProvider>
        <Story />
      </StoryFormProvider>
    ),
  ],
} satisfies Meta<typeof InputField>

export default meta

type Story = StoryObj<typeof InputField>

export const InputRequired = {
  args: {
    label: 'Reference Number',
    placeholder: 'hello world',
    required: true,
    name: 'heelo',
  },
} satisfies Story

export const InputHelperText = {
  args: {
    label: 'Reference Number',
    placeholder: 'hello world',
    helperText: 'Bottom optional helper text',
    name: '90339',
  },
} satisfies Story

export const InputSuccess = {
  args: {
    label: 'Reference Number',
    placeholder: 'hello world',
    success: 'Bottom optional helper text',
    name: '90339',
  },
} satisfies Story

export const InputError = {
  args: {
    label: 'Reference Number',
    placeholder: 'hello world',
    name: '90339',
  },
} satisfies Story

export const InputDisabled = {
  args: {
    label: 'Reference Number',
    placeholder: 'hello world',
    name: '90339',
    disabled: true,
  },
} satisfies Story
