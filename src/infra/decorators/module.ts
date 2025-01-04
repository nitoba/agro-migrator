import { DiContainer } from '../container'
import { type interfaces } from 'inversify'

type ProviderWithConfig = {
  provide: interfaces.ServiceIdentifier
  useClass: interfaces.Newable
  scope?: 'singleton' | 'transient' | 'request'
}

type Provider = ProviderWithConfig | ProviderWithConfig['provide']

type moduleOptions = {
  providers?: Provider[]
}

function isProviderWithConfig(
  provider: Provider
): provider is ProviderWithConfig {
  return (provider as ProviderWithConfig).provide !== undefined
}

export function Module(options?: moduleOptions) {
  const diContainer = DiContainer.getInstance()
  const providers = options?.providers ?? []

  for (const provider of providers) {
    if (isProviderWithConfig(provider)) {
      const binding = diContainer.bind(provider.provide).to(provider.useClass)

      switch (provider.scope) {
        case 'singleton':
          binding.inSingletonScope()
          break
        case 'transient':
          binding.inTransientScope()
          break
        case 'request':
          binding.inRequestScope()
          break
        default:
          break
      }
    } else {
      diContainer.bind(provider).toSelf()
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return (target: any) => target
}
