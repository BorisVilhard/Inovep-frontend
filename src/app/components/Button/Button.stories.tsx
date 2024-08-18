import { Meta, StoryObj } from '@storybook/react'
import Button from './Button'

const meta = {
  title: 'Common/Button',
  component: Button,
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof Button>

export const Primary = {
  args: {
    type: 'primary',
    children: 'Primary Button',
  },
} satisfies Story

export const Disabled = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
} satisfies Story
