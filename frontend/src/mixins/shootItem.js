//
// SPDX-FileCopyrightText: 2021 SAP SE or an SAP affiliate company and Gardener contributors
//
// SPDX-License-Identifier: Apache-2.0
//

import get from 'lodash/get'
import uniq from 'lodash/uniq'
import flatMap from 'lodash/flatMap'
import cloneDeep from 'lodash/cloneDeep'
import find from 'lodash/find'
import some from 'lodash/some'
import filter from 'lodash/filter'
import { mapGetters } from 'vuex'

import {
  getTimestampFormatted,
  getCreatedBy,
  isShootStatusHibernated,
  isReconciliationDeactivated,
  isTypeDelete,
  isTruthyValue
} from '@/utils'

export const shootItem = {
  props: {
    shootItem: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters([
      'selectedAccessRestrictionsForShootByCloudProfileNameAndRegion',
      'isSeedUnreachableByName',
      'projectNameByNamespace'
    ]),
    shootMetadata () {
      return get(this.shootItem, 'metadata', {})
    },
    shootName () {
      return this.shootMetadata.name
    },
    shootNamespace () {
      return this.shootMetadata.namespace
    },
    isShootMarkedForDeletion () {
      const confirmationDeprecated = get(this.shootAnnotations, ['confirmation.garden.sapcloud.io/deletion'], 'false')
      const confirmation = get(this.shootAnnotations, ['confirmation.gardener.cloud/deletion'], confirmationDeprecated)
      const deletionTimestamp = this.shootDeletionTimestamp

      return !!deletionTimestamp && isTruthyValue(confirmation)
    },
    shootCreatedBy () {
      return getCreatedBy(this.shootMetadata)
    },
    shootCreatedAt () {
      return getTimestampFormatted(this.shootMetadata.creationTimestamp)
    },
    shootCreationTimestamp () {
      return this.shootMetadata.creationTimestamp
    },
    isShootReconciliationDeactivated () {
      return isReconciliationDeactivated(this.shootMetadata)
    },
    shootGenerationValue () {
      return this.shootMetadata.generation
    },
    shootDeletionTimestamp () {
      return this.shootMetadata.deletionTimestamp
    },
    shootProjectName () {
      return this.projectNameByNamespace(this.shootMetadata)
    },

    shootAnnotations () {
      return get(this.shootMetadata, 'annotations', {})
    },
    shootGardenOperation () {
      return this.shootAnnotations['gardener.cloud/operation']
    },
    shootPurpose () {
      return get(this.shootSpec, 'purpose')
    },
    isTestingCluster () {
      return this.shootPurpose === 'testing'
    },
    shootExpirationTimestamp () {
      return this.shootAnnotations['shoot.gardener.cloud/expiration-timestamp'] || this.shootAnnotations['shoot.garden.sapcloud.io/expirationTimestamp']
    },
    isShootActionsDisabledForPurpose () {
      return this.shootPurpose === 'infrastructure'
    },
    shootSpec () {
      return get(this.shootItem, 'spec', {})
    },
    isShootSettingHibernated () {
      return get(this.shootSpec, 'hibernation.enabled', false)
    },
    isShootStatusHibernated () {
      return isShootStatusHibernated(get(this.shootItem, 'status'))
    },
    isShootStatusHibernationProgressing () {
      return this.isShootSettingHibernated !== this.isShootStatusHibernated
    },
    shootSecretBindingName () {
      return this.shootSpec.secretBindingName
    },
    shootK8sVersion () {
      return get(this.shootSpec, 'kubernetes.version')
    },
    shootEnableStaticTokenKubeconfig () {
      return get(this.shootSpec, 'kubernetes.enableStaticTokenKubeconfig', true)
    },
    shootCloudProfileName () {
      return this.shootSpec.cloudProfileName
    },
    shootCloudProviderKind () {
      return get(this.shootSpec, 'provider.type')
    },
    shootWorkerGroups () {
      return get(this.shootSpec, 'provider.workers', [])
    },
    shootAddons () {
      const addons = cloneDeep(get(this.shootSpec, 'addons', {}))
      return addons
    },
    shootRegion () {
      return this.shootSpec.region
    },
    shootZones () {
      return uniq(flatMap(get(this.shootSpec, 'provider.workers'), 'zones'))
    },
    podsCidr () {
      return get(this.shootSpec, 'networking.pods')
    },
    nodesCidr () {
      return get(this.shootSpec, 'networking.nodes')
    },
    servicesCidr () {
      return get(this.shootSpec, 'networking.services')
    },
    shootDomain () {
      return get(this.shootSpec, 'dns.domain')
    },
    isCustomShootDomain () {
      return some(this.shootDnsProviders, ['primary', true])
    },
    shootDnsProviders () {
      return get(this.shootSpec, 'dns.providers')
    },
    shootHibernationSchedules () {
      return get(this.shootSpec, 'hibernation.schedules', [])
    },
    shootMaintenance () {
      return get(this.shootSpec, 'maintenance', [])
    },

    shootInfo () {
      return get(this.shootItem, 'info', {})
    },
    seedShootIngressDomain () {
      return this.shootInfo.seedShootIngressDomain || ''
    },
    canLinkToSeed () {
      return get(this.shootItem, 'info.canLinkToSeed', false)
    },
    isShootLastOperationTypeDelete () {
      return isTypeDelete(this.shootLastOperation)
    },
    isShootLastOperationTypeControlPlaneMigrating () {
      return this.shootLastOperation.type === 'Migrate' || (this.shootLastOperation.type === 'Restore' && this.shootLastOperation.state !== 'Succeeded')
    },
    shootLastOperationTypeControlPlaneMigrationMessage () {
      switch (this.shootLastOperation.type) {
        case 'Migrate':
          return 'Deleting Resources on old Seed'
        case 'Restore':
          return 'Creating Resources on new Seed'
      }
      return ''
    },
    shootLastOperation () {
      return get(this.shootItem, 'status.lastOperation', {})
    },
    shootLastErrors () {
      return get(this.shootItem, 'status.lastErrors', [])
    },
    shootConditions () {
      return get(this.shootItem, 'status.conditions', [])
    },
    shootConstraints () {
      return get(this.shootItem, 'status.constraints', [])
    },
    shootReadiness () {
      const shootConstraintsWithErrorCode = filter(this.shootConstraints, constraint => {
        return constraint.codes && constraint.codes.length
      })
      return [
        ...this.shootConditions,
        ...shootConstraintsWithErrorCode
      ]
    },
    shootObservedGeneration () {
      return get(this.shootItem, 'status.observedGeneration')
    },
    shootTechnicalId () {
      return get(this.shootItem, 'status.technicalID')
    },
    shootSeedName () {
      return get(this.shootSpec, 'seedName')
    },
    isSeedUnreachable () {
      return this.isSeedUnreachableByName(this.shootSeedName)
    },
    shootSelectedAccessRestrictions () {
      return this.selectedAccessRestrictionsForShootByCloudProfileNameAndRegion({ shootResource: this.shootItem, cloudProfileName: this.shootCloudProfileName, region: this.shootRegion })
    },
    hibernationPossibleConstraint () {
      return find(this.shootConstraints, ['type', 'HibernationPossible'])
    },
    isHibernationPossible () {
      const status = get(this.hibernationPossibleConstraint, 'status', 'True')
      return status !== 'False'
    },
    hibernationPossibleMessage () {
      return get(this.hibernationPossibleConstraint, 'message', 'Hibernation currently not possible')
    },
    maintenancePreconditionSatisfiedConstraint () {
      const constraints = this.shootConstraints
      return find(constraints, ['type', 'MaintenancePreconditionsSatisfied'])
    },
    isMaintenancePreconditionSatisfied () {
      const status = get(this.maintenancePreconditionSatisfiedConstraint, 'status', 'True')
      return status !== 'False'
    },
    maintenancePreconditionSatisfiedMessage () {
      return get(this.maintenancePreconditionSatisfiedConstraint, 'message', 'It may not be safe to trigger maintenance for this cluster')
    }
  },
  methods: {
    shootActionToolTip (tooltip) {
      if (!this.isShootActionsDisabledForPurpose) {
        return tooltip
      }
      return 'Actions disabled for cluster with purpose infrastructure'
    }
  }
}

export default shootItem
