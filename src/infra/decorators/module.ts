import { DiContainer } from '../container'
import { type interfaces } from 'inversify'

type ExplicityProvider = {
  provide: interfaces.ServiceIdentifier
  useClass: interfaces.Newable
  scope?: 'singleton' | 'transient' | 'request'
}

type Provider = ExplicityProvider | ExplicityProvider['provide']

type moduleOptions = {
  providers?: Provider[]
}

export function Module(options?: moduleOptions) {
  const diContainer = DiContainer.getInstance()
  const providers = options?.providers ?? []

  for (const provider of providers) {
    if (isExplicityProvider(provider)) {
      switch (provider.scope) {
        case 'singleton':
          diContainer
            .bind(provider.provide)
            .to(provider.useClass)
            .inSingletonScope()
          break
        case 'transient':
          diContainer
            .bind(provider.provide)
            .to(provider.useClass)
            .inTransientScope()
          break
        case 'request':
          diContainer
            .bind(provider.provide)
            .to(provider.useClass)
            .inRequestScope()
          break
        default:
          diContainer.bind(provider.provide).to(provider.useClass)
      }
    } else {
      diContainer.bind(provider).toSelf()
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return (target: any) => target
}

function isExplicityProvider(
  provider: Provider
): provider is ExplicityProvider {
  return (provider as ExplicityProvider).provide !== undefined
}
