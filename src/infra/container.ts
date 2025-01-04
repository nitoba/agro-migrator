import 'reflect-metadata'
import { Container, type interfaces } from 'inversify'

export class DiContainer {
  private static container: Container = new Container()

  private constructor() {}

  static getInstance(): Container {
    if (!DiContainer.container) {
      DiContainer.container = new Container()
    }

    return DiContainer.container
  }

  static get<T>(identifier: interfaces.ServiceIdentifier<T>): T {
    return DiContainer.container.get<T>(identifier)
  }

  static addProvider<T>(
    identifier: interfaces.ServiceIdentifier<T>,
    provider: T
  ): void {
    DiContainer.container.bind<T>(identifier).toConstantValue(provider)
  }
}
